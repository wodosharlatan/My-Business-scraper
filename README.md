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
  14. Input town + keywords, press `Scrape Info`.
  15. Ensure info is being returned to Google Sheet.

## Optional (Format Keywords + Auto append Cities)
  1. Star the project ⭐ (Optional)
  2. Clone the project `git clone https://github.com/wodosharlatan/My-Business-scraper.git`
    1. You can change the keywords, but dont remove separators (===== LANGUAGE =====)
  3. Start the app
    1. Run `sh EnviromentMaker.sh` (needed to be done only once)
    2. Run `sudo sh Start.sh`
  4. Input town
  5. Copy the keywords from created `.txt` file and you are all set !



# HTML
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

# JS

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

# Keywords
```txt
=== ENGLISH ===

1. Cafe
2. Plumbing services
3. Hair salon
4. Roofing contractor
5. Landscaping company
6. Real estate agency
7. Dental clinic
8. Law firm
9. Accounting firm
10. HVAC repair
11. Auto repair shop
12. Fitness studio
13. Cleaning services
14. Construction company
15. Bakery
16. Barber shop
17. Catering services
18. Pest control
19. Electrician services
20. Daycare center
21. Interior design firm
22. IT support services
23. Car dealership
24. Insurance agency
25. Wedding planning
26. Marketing agency
27. Locksmith services
28. Pet grooming
29. Dry cleaning
30. Photography studio
31. Printing services
32. Furniture store
33. Moving company
34. Massage therapy
35. Spa services
36. Tattoo studio
37. Florist
38. Veterinarian clinic
39. Home cleaning
40. Carpet cleaning
41. Personal training
42. Tailoring services
43. Event planning
44. Architecture firm
45. Home renovation
46. Security services
47. Childcare services
48. Pool cleaning
49. Financial advisory
50. Window cleaning
51. Pest exterminator
52. Handyman services
53. Garden center
54. Auto detailing
55. Roofing services
56. Catering company
57. Car wash
58. Nail salon
59. Travel agency
60. Pharmacy
61. Landscaping services
62. Dog walking services
63. Property management
64. Funeral services
65. Optometry clinic
66. Medical spa
67. Chiropractor
68. Health clinic
69. Auto body shop
70. Appliance repair
71. Painting contractor
72. Rubbish removal
73. Water damage restoration
74. Flooring services
75. Pool installation
76. Solar installation
77. Tree service
78. Personal chef services
79. Private tutor
80. Lawn care services
81. Boat repair
82. Video production company
83. Digital marketing agency
84. Mortgage broker
85. Speech therapy clinic
86. Tax preparation services
87. Logistics company
88. Property inspection services
89. Nutritionist
90. Recruitment agency
91. Travel tour operator
92. Waste management company
93. Courier services
94. Freight forwarding
95. Martial arts school
96. Pet boarding services
97. Car rental company
98. SEO consulting
99. Event photography
100. Online store

=== CZECH ===

1. Kavárna
2. Instalatérské služby
3. Kadeřnictví
4. Pokrývačská firma
5. Zahradnické služby
6. Realitní kancelář
7. Zubní ordinace
8. Advokátní kancelář
9. Účetní firma
10. Opravy klimatizací
11. Autoservis
12. Fitness studio
13. Úklidové služby
14. Stavební firma
15. Pekařství
16. Holičství
17. Cateringové služby
18. Deratizace
19. Elektrikářské služby
20. Dětská školka
21. Interiérový design
22. IT podpora
23. Autosalon
24. Pojišťovací agentura
25. Svatební agentura
26. Marketingová agentura
27. Zámečnické služby
28. Péče o domácí mazlíčky
29. Čistírna oděvů
30. Fotografické studio
31. Tiskové služby
32. Prodejna nábytku
33. Stěhovací firma
34. Masážní terapie
35. Lázeňské služby
36. Tetovací studio
37. Květinářství
38. Veterinární klinika
39. Úklid domácností
40. Čištění koberců
41. Osobní trénink
42. Krejčovské služby
43. Plánování akcí
44. Architektonická firma
45. Rekonstrukce domů
46. Bezpečnostní služby
47. Péče o děti
48. Čištění bazénů
49. Finanční poradenství
50. Mytí oken
51. Exterminace škůdců
52. Opravářské služby
53. Zahradní centrum
54. Ruční mytí aut
55. Opravy střech
56. Cateringová firma
57. Automyčka
58. Nehtové studio
59. Cestovní kancelář
60. Lékárna
61. Zahradnické služby
62. Venčení psů
63. Správa nemovitostí
64. Pohřební služby
65. Oční ordinace
66. Lékařské lázně
67. Chiropraktik
68. Zdravotní klinika
69. Autoopravna
70. Opravy spotřebičů
71. Malířské služby
72. Odvoz odpadu
73. Obnova po vodním poškození
74. Pokládání podlah
75. Instalace bazénů
76. Instalace solárních panelů
77. Péče o stromy
78. Osobní kuchařské služby
79. Soukromý učitel
80. Péče o trávník
81. Opravy lodí
82. Produkce videí
83. Digitální marketingová agentura
84. Hypoteční poradce
85. Logopedická klinika
86. Daňové poradenství
87. Logistická firma
88. Inspekce nemovitostí
89. Výživový poradce
90. Personální agentura
91. Cestovní operátor
92. Odpadové hospodářství
93. Kurýrní služby
94. Přeprava zboží
95. Škola bojových umění
96. Psí hotel
97. Půjčovna aut
98. SEO konzultace
99. Fotografie z akcí
100. Online obchod


```

