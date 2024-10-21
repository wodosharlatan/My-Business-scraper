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
let AllowBlockSplit = false;
let BlockSize = 100;
let directory = '';

askForTown(); // Start the program by asking for the town


function mainModule() {
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
                    directory = `${Town.split(' ').join('_')}-${currentDate}`;
                    const fileName = `${Town.split(' ').join('_')}_${language}.txt`;
                    const dirPath = path.join(__dirname, directory);
                    const filePath = path.join(dirPath, fileName);

                    if (!folderCreated) {
                        fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 }); // Mode 0o777 or 0o755 doesn't work for some reason ???
                        setTimeout(() => {
                            // Change the ownership of the directory to the current user
                            // Time delay does not matter, just making sure the directory is created
                            changeOwnership(dirPath); 
                        }, 1000);
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
        // Now that the files are created, start splitting the keywords into smaller blocks
        if (AllowBlockSplit) {
            createBlocks(AllowBlockSplit);
        }   

        rl.close();
    })
};

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

// Helper function to ask for the town
function askForTown() {
    rl.question('Please enter the town you want to scrape: ', function (userInput) {
        Town = userInput.trim();
        askForAllowBlockSplit();
    });
}

// Helper function to ask about block splitting
function askForAllowBlockSplit() {
    rl.question('Split the keywords into smaller blocks? (helps prevent execution timeout) ([Yes/y],[No]): ', function (userInput) {
        if (userInput.toLowerCase() === 'yes' || userInput.toLowerCase() === 'y') {
            AllowBlockSplit = true;
        }
        askForBlockSize(AllowBlockSplit);
    });
}

// Helper function to ask for the block size
function askForBlockSize(blockSpliting) {
    if (blockSpliting) {
        rl.question('Set the block size (between 1 and 100): ', function (userInput) {
            const size = parseInt(userInput, 10);
            if (size > 100 || size < 1 || isNaN(size)) {
                console.log('Block size must be a number between 1 and 100');
            } else {
                BlockSize = size;
                console.log(`Town: ${Town}, AllowBlockSplit: ${blockSpliting}, BlockSize: ${BlockSize}`);
                mainModule();
            }
        });
    } else {
        console.log(`Town: ${Town}, AllowBlockSplit: ${blockSpliting}, BlockSize: ${BlockSize}`);
        mainModule();
    }
}

// Helper function to create blocks -> overly complicated
function createBlocks() {
    // Read the files in the directory
    const files = fs.readdirSync(directory);

    files.forEach((file,fileIndex) => {
        fs.mkdirSync(`${directory}/folder/${fileIndex}`, { recursive: true, mode: 0o755 }); // Mode 0o777 or 0o755 doesn't work for some reason ???
            setTimeout(() => {
                // Change the ownership of the directory to the current user
                // Time delay does not matter, just making sure the directory is created
                changeOwnership(`${directory}/folder/${fileIndex}`); 
            }, 1000);
        folderCreated = true;

        const filePath = path.join(directory, file)
        const fileData = fs.readFileSync(filePath, 'utf8');
        const keywords = fileData.split(',');
        let block = '';
        let blockIndex = 1;
        
        // Split the keywords into smaller blocks and create new files
        keywords.forEach((keyword, index) => {
            block += `${keyword},`;
            if ((index + 1) % BlockSize === 0) {
                const blockFilePath = path.join(__dirname,directory,'folder',`${fileIndex}`, `${file.replace('.txt', '')}-${blockIndex}.txt`);
                fs.writeFileSync(blockFilePath, block.trim(), 'utf8');
                console.log(`Created block file: ${blockFilePath}`);
                block = '';
                blockIndex++;
            }
        });
    });
}