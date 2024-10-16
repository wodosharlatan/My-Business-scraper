# My-Business-scraper

## Disclaimer
  1. You need a google workspace account for this to work. 
  2. This is a free solution, you don't have to pay for tools like Outscraper, but it is a little harder to use.


## Step by step Guide
  1. Open a new Google Sheet. (this is the only Google Sheet where your results will return to)
  2. Go to 'Extensions' → 'Apps Script'
  3. Go to the `Code.gs` file and paste the code from the first code block (see below)
  4. Next, create an HTML file and name it `index.html` (make sure to check it google might save it as `index.html.html`)
  5. Paste the code from the second code block (see below)
  6. Go to the Google Cloud Console. 
  7. In the search bar, search for the `Places API` page.
  8. Enable the Google Places API and make a new API key. 
  9. Input the API key you generated into the settings as a new variable. 
  10. Run and save the script. 
  11. Make a web app deployment. 
  12. Grant access to the app. 
  13. Copy the link, open in a new tab. 
  14. Input keywords, press `Scrape Info`.
  15. Ensure info is being returned to Google Sheet.



```html
<!DOCTYPE html>
<html>
<head>
    <title>Google My Business Scraper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f0f0f0;
        }
        #container, .videos-container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s ease-in-out;
            margin-bottom: 20px;
        }
        .center {
            display: flex;
            justify-content: center;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        textarea, button {
            width: calc(100% - 22px);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            border: 1px solid #ccc;
            box-sizing: border-box;
        }
        textarea:focus, button:focus {
            border-color: #feb650;
            outline: none;
        }
        button {
            background-color: #feb650;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s ease-in-out, transform 0.2s ease-in-out;
        }
        button:hover {
            background-color: darken(#feb650, 5%);
            transform: translateY(-2px);
        }
        #message {
            opacity: 0;
            transition: opacity 2s ease-in-out;
        }
        .videos-row {
            display: flex;
            justify-content: center;
            gap: 20px; /* Adjust the space between videos */
            flex-wrap: wrap;
        }
        .video-wrapper {
            padding-top: 177.77%; /* 9:16 Aspect Ratio */
            position: relative;
            flex-basis: 20%; /* Adjust based on desired video size, keeping the aspect ratio */
            min-width: 120px; /* Minimum width to maintain usability */
        }
        .video-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
        }
        footer {
            text-align: center;
            margin-top: 20px;
        }
        a {
            color: #feb650;
            text-decoration: none;
            transition: color 0.3s ease-in-out;
        }
        a:hover {
            color: darken(#feb650, 10%);
        }
    </style>
</head>
<body>
    <div id="container" class="center">
        <h2>Scrape Google My Business Info</h2>
        <textarea id="keywords" placeholder="Enter keywords, separated by commas"></textarea>
        <button onclick="scrapeInfo()">Scrape Info</button>
        <div id="message"></div>
    </div>

    <script>
      function scrapeInfo() {
        var keywords = document.getElementById('keywords').value.split(',');
        if(keywords[0] === "") {
            showMessage("Please enter at least one keyword.", "error");
            return;
        }
        google.script.run.withSuccessHandler(function(){
            showMessage("Scraping initiated. Check the sheet for updates.", "success");
        }).withFailureHandler(function(err){
            showMessage("Error: " + err, "error");
        }).scrapeBusinessInfoForMultipleKeywords(keywords);
      }

      function showMessage(message, type) {
        var messageDiv = document.getElementById('message');
        messageDiv.innerText = message;
        messageDiv.style.color = type === "error" ? "red" : "green";
        messageDiv.style.opacity = 1; // Trigger fade-in
      }
    </script>
</body>
</html>
```


```js
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index.html');
}

function scrapeBusinessInfoForMultipleKeywords(keywords) {
  keywords.forEach(function(keyword, index) {
    Utilities.sleep(1000 * index); // Delay to avoid hitting API limits
    scrapeBusinessInfo(keyword.trim());
  });
}

function scrapeBusinessInfo(keyword, nextPageToken = '') {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_API_KEY');
  let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&key=${apiKey}`;

  if (nextPageToken) {
    apiUrl += `&pagetoken=${nextPageToken}`;
  }

  const response = UrlFetchApp.fetch(apiUrl, {muteHttpExceptions: true});
  const json = JSON.parse(response.getContentText());

  switch (json.status) {
    case 'OK':
      processBusinessResults(json.results, apiKey);
      if (json.next_page_token) {
        Utilities.sleep(2000); // Delay for API's next page token availability
        scrapeBusinessInfo(keyword, json.next_page_token);
      }
      break;
    case 'OVER_QUERY_LIMIT':
      Logger.log('Query Limit Reached');
      break;
    default:
      Logger.log(`Error: ${json.status}`);
      break;
  }
}

function processBusinessResults(results, apiKey) {
  results.forEach(function(business) {
    const details = getBusinessDetails(business.place_id, apiKey);
    const data = [
      business.name,
      business.formatted_address,
      details.website || 'N/A',
      details.formatted_phone_number || 'N/A',
    ];
    appendDataToSheet(data);
  });
}

function getBusinessDetails(placeId, apiKey) {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website&key=${apiKey}`;
  const response = UrlFetchApp.fetch(detailsUrl, {muteHttpExceptions: true});
  const json = JSON.parse(response.getContentText());
  return json.result || {};
}

function appendDataToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow(data);
}

```

