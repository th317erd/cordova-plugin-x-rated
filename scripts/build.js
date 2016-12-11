module.exports = function(context) {
  var fs = require('fs'),
      path = require('path'),
      Q = context.requireCordovaModule('q'),
      finishedDeferred = new Q.defer(),
      D = require('devoir'),
      dust = require('dustjs-linkedin'),
      dustH = require('dustjs-helpers'),
      less = require('less'),
      browserify = require('browserify');
  
  require('dustjs-helpers');

  dust.config.whitespace = true;
  
  function loadTemplate(templatePath, name) {
    var src = fs.readFileSync(templatePath, 'utf8');
    var compiled = dust.compile(src, name);
    dust.loadSource(compiled);

    //console.log('Loaded template: ', name, templatePath);

    return {
      name: name,
      path: templatePath,
      template: compiled
    };
  }

  function render(template, data) {
    return Q.Promise(function(resolve, reject) {
      dust.render(template.name, data, function(err, out) {
        if (err) {
          reject({
            file: template.path,
            message: err
          });
          return;
        }

        resolve({
          template: template,
          path: template.path,
          output: out
        });
      });  
    });
  }

  function loadTemplates(templatePath) {
    var templateNames = fs.readdirSync(templatePath),
        templates = [];

    for (var i = 0, il = templateNames.length; i < il; i++) {
      var templateName = templateNames[i],
          fullPath = path.join(templatePath, templateName),
          name = templateName.replace(/^([^.]+).*/,'$1'),
          template = {name: name, path: fullPath};

      template.template = loadTemplate(fullPath, name);
      templates.push(template);
    }

    return templates;
  }

  function loadWidgets(widgetPath) {
    var widgetNames = fs.readdirSync(widgetPath),
        widgets = [],
        template;

    for (var i = 0, il = widgetNames.length; i < il; i++) {
      var widgetName = widgetNames[i],
          widget = {name: widgetName, templates: {}, path: path.join(widgetPath, widgetName)};

      try {
        var subParts = fs.readdirSync(path.join(widgetPath, widgetName, 'templates'));
        for (var j = 0, jl = subParts.length; j < jl; j++) {
          var subName = subParts[j],
              name = subName.replace(/^([^.]+).*/,'$1'),
              fullName = widgetName + ':' + name;
          
          widget.templates[fullName] = loadTemplate(path.join(widgetPath, widgetName, 'templates', subName), fullName);
        }
      } catch(e) {}

      widget.templates[widgetName] = loadTemplate(path.join(widgetPath, widgetName, 'widget.html'), widgetName);

      var cssPath = path.join(widgetPath, widgetName, 'widget.less'),
          jsPath = path.join(widgetPath, widgetName, 'widget.js');

      try {
        widget.css = fs.readFileSync(cssPath, 'utf8');
      } catch(e) {}
      
      try {
        widget.script = fs.readFileSync(jsPath, 'utf8');
      } catch(e) {}

      widgets.push(widget);
    }

    return widgets;
  }

  function build(buildPath, outputPath) {
    return Q.Promise(function(resolve, reject) {
      var deferreds = [];
      var config = global.config = require(path.join(buildPath, 'framework', 'config.js'))(),
          mainEntryPath = path.join(buildPath, 'framework', 'main.js'),
          mainModule = require(mainEntryPath);

      mainModule.init(D, dust);

      /* Load all widgets */
      //var templates = loadTemplates(path.join(buildPath, 'templates')),
      var widgets = loadWidgets(path.join(buildPath, 'widgets'));

      /* Build CSS */
      var cssFiles = fs.readdirSync(path.join(buildPath, 'style')),
          allCSS = [],
          compiledTemplates = ['module.exports=function(){'];

      cssFiles = cssFiles.sort();
      for (var i = 0, il = cssFiles.length; i < il; i++) {
        var fileName = cssFiles[i],
            fullFileName = path.join(buildPath, 'style', fileName),
            cssContents;

        try {
          cssContents = fs.readFileSync(fullFileName, 'utf8');

          if (cssContents.match(/\/\*\s*order:\s*\w+\s*\*\//))
            allCSS.push(cssContents);
          else
            allCSS.push("/* order: M" + i + " */\n\n" + cssContents);
        } catch(e) {}
      }

      for (var i = 0, il = widgets.length; i < il; i++) {
        var widget = widgets[i];

        if (widget.css) {
          if (widget.css.match(/\/\*\s*order:\s*\w+\s*\*\//))
            allCSS.push(widget.css);
          else
            allCSS.push("/* order: W" + i + " */" + widget.css);
        }

        var templateKeys = Object.keys(widget.templates);
        for (var j = 0, jl = templateKeys.length; j < jl; j++) {
          var templateKey = templateKeys[j],
              template = widget.templates[templateKey];

          (function(widget, template) {
            //Check for template errors
            dust.render(template.name, {}, function(err, out) {
              if (err)
                console.error('Error in template [' + widget.name + '][' + template.name + ']: ' + err);
            });  
          })(widget, template);

          compiledTemplates.push(template.template);
          compiledTemplates.push(';\n');
        }
      }

      compiledTemplates.push('};');

      var stream = require("stream");
      var compiledTemplatesStream = new stream.PassThrough();
      compiledTemplatesStream.write(compiledTemplates.join(''));
      compiledTemplatesStream.end();

      allCSS = allCSS.sort(function(a, b) {
        function getOrder(chunk) {
          var parts = chunk.match(/\/\*\s*order:\s*(\w+)\s*\*\//);
          return (parts && parts[1]) ? parts[1] : ('Z' + 999);
        }

        var x = getOrder(a),
            y = getOrder(b);

        return (x == y) ? 0 : (x < y) ? -1 : 1;
      });

      less.render(allCSS.join('\n'), {
        paths: [path.join(buildPath, 'style')],
        compress: false
      }, function(err, output) {
        if (err) {
          console.error(err);
          return;
        }

        fs.writeFileSync(path.join(outputPath, 'style', 'main.css'), output.css);
      });

      var indexName = path.join(buildPath, 'index.html'),
          template = loadTemplate(indexName, '_main_');

      deferreds.push(Q.Promise(function(resolve, reject) {
        render(template, config.data).then(function(result) {
          fs.writeFileSync(path.join(outputPath, 'index.html'), result.output);
          resolve(result.output);
        }, function(err) {
          console.log('Render error: ', err);
          reject(err);
        });
      }));
      
      deferreds.push(Q.Promise(function(resolve, reject) {
        var baseDir = path.join(buildPath, 'framework'),
            b = browserify({
              basedir: baseDir
            });

        for (var i = 0, il = widgets.length; i < il; i++) {
          var widget = widgets[i];

          if (widget.script) {
            b.require(path.join(widget.path, 'widget.js'), {
              expose: 'widget.' + widget.name
            });  
          }
        }

        b.require(compiledTemplatesStream, {
          expose: 'compiledTemplates',
          basedir: baseDir
        });
        b.exclude('compiledTemplates');

        b.add(mainEntryPath);

        b.bundle(function(err, content) {
          if (err) {
            reject(err);
            return;
          }

          fs.writeFileSync(path.join(outputPath, 'javascript', 'main.js'), content.toString());
          resolve(content);
        });
      }));

      Q.all(deferreds).then(function(results) {
        resolve();
      }, function(err) {
        reject(err);
      });
    });
  }

  dust.isDebug = true;
  dust.debugLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

  return build(path.join(context.opts.projectRoot, 'application'), path.join(context.opts.projectRoot, 'www'));
};
