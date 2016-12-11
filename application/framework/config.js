module.exports = function() {
	var stateList = [{name:'Alabama',code:'AL'},{name:'Alaska',code:'AK'},{name:'Arizona',code:'AZ'},{name:'Arkansas',code:'AR'},{name:'California',code:'CA'},{name:'Colorado',code:'CO'},{name:'Connecticut',code:'CT'},{name:'Delaware',code:'DE'},{name:'Florida',code:'FL'},{name:'Georgia',code:'GA'},{name:'Hawaii',code:'HI'},{name:'Idaho',code:'ID'},{name:'Illinois',code:'IL'},{name:'Indiana',code:'IN'},{name:'Iowa',code:'IA'},{name:'Kansas',code:'KS'},{name:'Kentucky',code:'KY'},{name:'Louisiana',code:'LA'},{name:'Maine',code:'ME'},{name:'Maryland',code:'MD'},{name:'Massachusetts',code:'MA'},{name:'Michigan',code:'MI'},{name:'Minnesota',code:'MN'},{name:'Mississippi',code:'MS'},{name:'Missouri',code:'MO'},{name:'Montana',code:'MT'},{name:'Nebraska',code:'NE'},{name:'Nevada',code:'NV'},{name:'New Hampshire',code:'NH'},{name:'New Jersey',code:'NJ'},{name:'New Mexico',code:'NM'},{name:'New York',code:'NY'},{name:'North Carolina',code:'NC'},{name:'North Dakota',code:'ND'},{name:'Ohio',code:'OH'},{name:'Oklahoma',code:'OK'},{name:'Oregon',code:'OR'},{name:'Pennsylvania',code:'PA'},{name:'Rhode Island',code:'RI'},{name:'South Carolina',code:'SC'},{name:'South Dakota',code:'SD'},{name:'Tennessee',code:'TN'},{name:'Texas',code:'TX'},{name:'Utah',code:'UT'},{name:'Vermont',code:'VT'},{name:'Virginia',code:'VA'},{name:'Washington',code:'WA'},{name:'West Virginia',code:'WV'},{name:'Wisconsin',code:'WI'},{name:'Wyoming',code:'WY'},{name:'Washington DC',code:'DC'}];
  var monthList = [{name:'January',code:'1'},{name:'February',code:'2'},{name:'March',code:'3'},{name:'April',code:'4'},{name:'May',code:'5'},{name:'June',code:'6'},{name:'July',code:'7'},{name:'August',code:'8'},{name:'September',code:'9'},{name:'October',code:'10'},{name:'November',code:'11'},{name:'December',code:'12'}];

	return {
		baseURL: 'http://my.api.url',
		headers: {
			//default API headers
		},
		data: {
			app: {
				title: 'X-Rated App'
			},
			states: stateList,
			months: monthList
		},
		fakeAPIData: {
			'test': {
				data: 'Hello world!'
			}
		}
	};
};