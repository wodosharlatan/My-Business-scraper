require('dotenv').config();

const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let Town = '';

rl.question('Please enter the town you want to scrape: ', function(userInput) {
    Town = userInput.trim();

    fs.readFile('Keywords.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err.message);
            rl.close();
            return;
        }
    
        const currentDate = getCurrentDate();
        let lines = data.split('\n');
        let result = '';
        let language = '';
        let folderCreated = false;
    
        lines.forEach((line, index) => {
            const languageMatch = line.match(/^===\s(.+)\s===/); // Match lines like "=== LANGUAGE ==="

            if (languageMatch != null) {
                language = languageMatch[1].trim();
            }

            // If a new language section is found, create a new file with the previous language's keywords
            if (languageMatch) {
                if (result != null) {
                    const dirName = `${Town}-${currentDate}`;
                    const fileName = `${Town}-${language}.txt`;
                    const dirPath = path.join(__dirname, dirName);
                    const filePath = path.join(dirPath, fileName);
    
                    if (!folderCreated) {
                        fs.mkdirSync(dirPath,{ recursive: true, mode: 0o755 }); // Mode 0o777 or 0o755 doesn't work for some reason ???
                        changeOwnership(dirPath); // Change the ownership of the directory to the current user
                        folderCreated = true;
                    }
    
                    fs.writeFileSync(filePath, result.trim(), 'utf8');
                    console.log(`Created file: ${filePath}`);
                    result = '';
                }
            } else {
                // Match lines starting with "number. keyword"
                const match = line.match(/^\d+\.\s(.+)/);
                if (match) {
                    // Replace the number with the user's input and append the keyword
                    result += `${Town} ${match[1]},`;
                }
            }
        });
    });

    rl.close();
});



// Helper function to get the current date in the format DD-MM-YYYY
function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
}

// Helper function to change the ownership of a directory
function changeOwnership(dirPath) {
    const username = process.env.CURRENT_USER; // Get the username from the command output
    const command = `sudo chown -R ${username}:${username} ${dirPath}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error changing ownership: ${stderr}`);
            return;
        }
        console.log(`Ownership changed successfully to ${username}`);
    });
}