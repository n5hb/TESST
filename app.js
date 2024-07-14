// *** ENTERTAINMENT WIDGET *** 
const entDiv = document.getElementById("ent");
const entPref = document.getElementById("ent-preferences")
const entCover = document.getElementById("ent-cover")
const entInfo = document.getElementById("ent-info");

var flipped = 0;
var prefVisible = 0;
function flip(){
    entDiv.style.transform = entDiv.style.transform === 'rotateY(180deg)' 
    ? 'rotateY(0deg)' 
    : 'rotateY(180deg)';

    flipped = entDiv.style.transform=='rotateY(0deg)'
        ? 0
        : 1;
}

function preferences(){
    if(prefVisible==0){
        if(generated==0){
            document.getElementById("spin").style.transform = 'rotate(100deg)';
            sleep(100).then(() => {
                flip();            
                prefVisible = 1;
                entPref.style.display = 'flex';
                if(flipped==1){
                    entPref.style.transform = 'rotateY(180deg)';
                    entInfo.style.display = 'none';
                } else{
                    entPref.style.transform = 'rotateY(0deg)';
                    entCover.style.display = 'none';
                }
            });
        } else{
            flip();
            prefVisible = 1;
            entPref.style.display = 'flex';
            if(flipped==1){
                entPref.style.transform = 'rotateY(180deg)';
                entInfo.style.display = 'none';
            } else{
                entPref.style.transform = 'rotateY(0deg)';
                entCover.style.display = 'none';
            }
        }
    } else{
        flip()
        prefVisible = 0;
        sleep(400).then(() => { 
            if(generated==1){
                entPref.style.display = 'none';
                entInfo.style.display = 'flex';
                entCover.style.display = 'flex';
            } else{
                document.getElementById("spin").style.transform = 'rotate(0deg)';
            }
         });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var count = 0;
function play(){
    if(count==0){
        count = 1;
        document.getElementById("track").load();
        document.getElementById("track").play();
    } else{
        count = 0;
        document.getElementById("track").pause();
    }
}

var generated = 0;
function reveal(){
    if(generated==1){
        document.getElementById("cover-title").textContent = document.getElementById("cover-title").dataset.trackName;
        document.getElementById("album-img").style.filter = 'blur(0px)';
        document.getElementById('cover-button').innerHTML = '<button onclick="flip()">INFO</button>';
    }
}


const infoWrapper = document.getElementById("info-wrapper");
const titleDiv = document.getElementById("info-title");
const artistDiv = document.getElementById("artist");
const albumDiv = document.getElementById("album-name");

function overflowScrollInfo(textDiv) {
    let prefix = ''
    switch(textDiv){
        case titleDiv:
            prefix = 'title';
            break;
        case artistDiv:
            prefix = 'artist';
            break;
        case albumDiv:
            prefix = 'album';
            break;
        default:
            console.log('ERROR');
            break;
    }
    if (textDiv.offsetWidth > (infoWrapper.offsetWidth)) {
        textDiv.classList.add('scrolling');
        textDiv.classList.add('scroll-spacing');

        document.getElementById(`${prefix}-2`).textContent = textDiv.textContent;
        document.getElementById(`${prefix}-2`).classList.add('scrolling2');
        document.getElementById(`${prefix}-2`).classList.add('scroll-spacing');
    } else{
        textDiv.classList.remove('scrolling');
        document.getElementById(`${prefix}-2`).textContent = '';
        document.getElementById(`${prefix}-2`).classList.remove('scrolling2');
        document.getElementById(`${prefix}-2`).classList.remove('scroll-spacing');
    }
}

const infoResizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
        if (entry.target) {
            overflowScrollInfo(entry.target);
        }
    }
});

infoResizeObserver.observe(titleDiv);
infoResizeObserver.observe(artistDiv);
infoResizeObserver.observe(albumDiv);


const coverWrapper = document.getElementById("ent-cover");
const coverTitle = document.getElementById("cover-title");

const coverResizeObserver = new ResizeObserver(() => {
    (function overflowScrollCover() {
        const scrollDiv = document.getElementById('cover-title-2')
        if (coverTitle.offsetWidth > (coverWrapper.offsetWidth * 0.80)) {
            coverTitle.classList.add('coverScroll');
            coverTitle.classList.add('scroll-spacing');
    
            scrollDiv.style.display = 'block';
            scrollDiv.textContent = coverTitle.textContent;
            scrollDiv.classList.add('coverScroll2');
            scrollDiv.classList.add('scroll-spacing');
        } else{
            coverTitle.parentElement.style.justifyContent = 'center';
            coverTitle.classList.remove('coverScroll');

            scrollDiv.style.display = 'none';
            scrollDiv.textContent = '';
            scrollDiv.classList.remove('coverScroll2');
            scrollDiv.classList.remove('scroll-spacing');
        }
    })();
})

coverResizeObserver.observe(coverTitle);


// API back-end
const APIController = (function() {
    const clientId = '9166be1779354c139ed15ab76687f239';
    const clientSecret = 'bd44fcee05f2409ea59671ea0282c6cd';

    const _getToken = async () => {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    const _getRecommendations = async (token, genres, limit = 1) => {
        try {
            const result = await fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&seed_genres=${genres.join(',')}`, {
                method: 'GET',
                headers: { 'Authorization' : 'Bearer ' + token}
            });
    
            if (!result.ok) {
                throw new Error(`HTTP error! status: ${result.status}`);
            }
    
            const data = await result.json();
            return data.tracks;
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            return [];
        }
    }

    return {
        getToken() {
            return _getToken();
        },
        getRecommendations(token, genres, limit) {
            return _getRecommendations(token, genres, limit);
        }
    }
})();


// In UIController
const UIController = (function() {
    const DOMElements = {
        hfToken: '#hidden_token',
        genreSelect: '#genre-select',
        recommendButton: '#ent-save'
    }

    return {
        inputField() {
            return {
                genreSelect: document.querySelector(DOMElements.genreSelect),
                recommendButton: document.querySelector(DOMElements.recommendButton)
            }
        },

        displayRecommendation(track) {
            // const audioElement = document.getElementById('track');
            // const audioSourceElement = document.getElementById('tracke');

            // if(track.preview_url){
            //     document.getElementById("tracke").src = track.preview_url
            // } else{
            //     console.log('No audio preview.');
            //     document.getElementById("ent-play-button").style.backgroundColor = '#774E45';
            //     document.getElementById("ent-play-button").style.borderColor = '#774E45';
            // }

            console.log(track.preview_url)
        
            document.getElementById("album-img").parentElement.innerHTML = '<img id="album-img" src="" draggable="false"></img>';
            document.getElementById("album-img").src = track.album.images[0].url;
            document.getElementById("album-img").style.filter = 'blur(10px)';
            document.getElementById("album-img").alt = track.album.name;
            document.getElementById("cover-title").dataset.trackName = track.name;
            document.getElementById("info-title").textContent = track.name;
            document.getElementById("artist").textContent = track.artists[0].name;
            document.getElementById("album-name").textContent = track.album.name;
            document.getElementById("year").textContent = track.album.release_date.split('-')[0];
            document.getElementById("track-link").href = track.external_urls.spotify;

            // document.getElementById("ent-cover-text-cqi").textContent = track.name;
        },

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }
})();

// In APPController
const APPController = (function(UICtrl, APICtrl) {
    const DOMInputs = UICtrl.inputField();
    let dailyUpdateTimeout;

    const loadGenres = async () => {
        const token = await APICtrl.getToken();           
        UICtrl.storeToken(token);
    }

    const getSelectedGenres = () => {
        return Array.from(DOMInputs.genreSelect.selectedOptions).map(option => option.value);
    }

    const generateRecommendation = async () => {
        const token = UICtrl.getStoredToken().token;
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length === 0) {
            console.log('No genres selected');
            return;
        } else{
            document.getElementById("ent-welcome").style.display = 'none';
            generated = 1;
        }
        const tracks = await APICtrl.getRecommendations(token, selectedGenres, 1);
        if (tracks.length > 0) {
            UICtrl.displayRecommendation(tracks[0]);
        } else {
            console.log('No recommendations found');
        }
    }

    const scheduleDailyUpdate = () => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);  // Ensure it's midnight
        const millisTillMidnight = tomorrow.getTime() - now.getTime();

        if (dailyUpdateTimeout) {
            clearTimeout(dailyUpdateTimeout);
        }

        dailyUpdateTimeout = setTimeout(() => {
            generateRecommendation();
            scheduleDailyUpdate(); // Schedule the next update
        }, millisTillMidnight);

        // Log the next update time (for debugging)
        console.log(`Next update scheduled for: ${tomorrow.toLocaleString()}`);
    }

    let initialRecommendationGenerated = false;

    const checkAndGenerateRecommendation = () => {
        if (!initialRecommendationGenerated) {
            const selectedGenres = getSelectedGenres();
            if (selectedGenres.length > 0) {
                generateRecommendation();
                scheduleDailyUpdate();
                initialRecommendationGenerated = true;
                DOMInputs.genreSelect.removeEventListener('change', checkAndGenerateRecommendation);
                DOMInputs.genreSelect.addEventListener('change', handleGenreChange);
                DOMInputs.recommendButton.removeEventListener('click', checkAndGenerateRecommendation);
            }
        }
    }

    let genresChanged = false;

    const handleGenreChange = () => {
        genresChanged = true;
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length > 0) {
            scheduleDailyUpdate();
        } else {
            if (dailyUpdateTimeout) {
                clearTimeout(dailyUpdateTimeout);
            }
            DOMInputs.genreSelect.addEventListener('change', checkAndGenerateRecommendation);
        }
    }

    return {
        init() {
            console.log('App is starting');
            loadGenres();
            DOMInputs.recommendButton.addEventListener('click', checkAndGenerateRecommendation);

            // Check every minute if it's midnight and needs to update
            setInterval(() => {
                const now = new Date();
                if (now.getHours() === 0 && now.getMinutes() === 0) {
                    if (genresChanged) {
                        generateRecommendation();
                        genresChanged = false;
                    }
                    scheduleDailyUpdate();
                }
            }, 60 * 1000); // Check every minute
        }
    }
})(UIController, APIController);

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    APPController.init();
});



// *** PRODUCTIVITY WIDGET ***

// Get all the necessary elements
const prodMain = document.getElementById('prod-main');
const toDo = document.getElementById('to-do');
const inProgress = document.getElementById('in-progress');
const done = document.getElementById('done');
const redButton = document.querySelector('.circle.red');
const orangeButton = document.querySelector('.circle.orange');
const greenButton = document.querySelector('.circle.green');
const deleteButton = document.querySelector('.control.delete');
const addButton = document.querySelector('.control.add');

// Function to hide all divs
function hideAllDivs() {
    prodMain.style.display = 'none';
    toDo.style.display = 'none';
    inProgress.style.display = 'none';
    done.style.display = 'none';
}

// Function to show a specific div
function showDiv(div) {
    hideAllDivs();
    div.style.display = 'block';
}

// Function to create a new task div
function createTaskDiv() {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'tasks';
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    taskDiv.appendChild(taskContent);
    return taskDiv;
}

function addTask() {
    let currentOpenState;
    if (toDo.style.display === 'block') {
        currentOpenState = toDo;
    } else if (inProgress.style.display === 'block') {
        currentOpenState = inProgress;
    } else if (done.style.display === 'block') {
        currentOpenState = done;
    } else {
        // If no state is open, don't add a task
        return;
    }

    const tasksContainer = currentOpenState.querySelector('.tasks-container');
    const newTask = createTaskDiv();
    tasksContainer.appendChild(newTask);
}

// Event listeners for the buttons
redButton.addEventListener('click', () => showDiv(toDo));
orangeButton.addEventListener('click', () => showDiv(inProgress));
greenButton.addEventListener('click', () => showDiv(done));
deleteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Initially show the main div
showDiv(prodMain);

// Update scroll visibility for all states initially
[toDo, inProgress, done].forEach(state => {
    const container = state.querySelector('.tasks-container');
    // updateScrollVisibility(container);
});

// Function to update the pie chart and task count
function updatePieChart() {
    const todoTasks = toDo.querySelectorAll('.tasks').length;
    const inProgressTasks = inProgress.querySelectorAll('.tasks').length;
    const doneTasks = done.querySelectorAll('.tasks').length;
    const totalTasks = todoTasks + inProgressTasks + doneTasks;

    if (totalTasks === 0) return;

    const todoPercentage = (todoTasks / totalTasks) * 100;
    const inProgressPercentage = (inProgressTasks / totalTasks) * 100;
    const donePercentage = (doneTasks / totalTasks) * 100;

    const pie = document.querySelector('.pie');
    pie.style.setProperty('--p1', todoPercentage);
    pie.style.setProperty('--p2', inProgressPercentage);
    pie.style.setProperty('--p3', donePercentage);

    // Update the task count
    const tasksText = pie.querySelector('.tasks-text');
    tasksText.innerHTML = `${todoTasks}<br>to-do`;
}

// Function to create a new task div
function createTaskDiv() {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'tasks';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskWritten = document.createElement('div');
    taskWritten.className = 'task-written';
    
    const taskDate = document.createElement('div');
    taskDate.className = 'task-date';
    
    taskContent.appendChild(taskWritten);
    taskContent.appendChild(taskDate);
    taskDiv.appendChild(taskContent);
    
    return taskDiv;
}

function addTask() {
    let currentOpenState;
    if (toDo.style.display === 'block') {
        currentOpenState = toDo;
    } else if (inProgress.style.display === 'block') {
        currentOpenState = inProgress;
    } else if (done.style.display === 'block') {
        currentOpenState = done;
    } else {
        // If no state is open, don't add a task
        return;
    }

    const tasksContainer = currentOpenState.querySelector('.tasks-container');
    const newTask = createTaskDiv();
    tasksContainer.appendChild(newTask);

    updatePieChart();
}

// Event listeners for the buttons
redButton.addEventListener('click', () => { showDiv(toDo); updatePieChart(); });
orangeButton.addEventListener('click', () => { showDiv(inProgress); updatePieChart(); });
greenButton.addEventListener('click', () => { showDiv(done); updatePieChart(); });
deleteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Initially show the main div and update the pie chart
showDiv(prodMain);
updatePieChart();



// *** EDUCATIONAL WIDGET ***
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const currentYear = today.getFullYear();
const date = new Date(2000, month - 1, day);
const dateString = date.toLocaleString('en-US', { month: 'long', day: 'numeric' }) + ',';

let eduContent = [];
let currentIndex = 0;
let isAnimating = false;

async function fetchHistoricalEvents() {
    let url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

    try {
        let response = await fetch(url, {
            headers: {
                'User-Agent': 'On This Day in History/1.0 jarron.decrepito26@gmail.com'
            }
        });

        let data = await response.json();

        function getRandomItem(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function extractDetails(item, isHoliday = false) {
            return {
                text: item.text,
                year: isHoliday ? currentYear : item.year,
                thumbnail: item.pages[0]?.thumbnail?.source || 'No thumbnail available'
            };
        }

        eduContent = [
            ['events', extractDetails(getRandomItem(data.events))],
            ['births', extractDetails(getRandomItem(data.births))],
            ['deaths', extractDetails(getRandomItem(data.deaths))],
            ['holidays', extractDetails(getRandomItem(data.holidays), true)],
            ['selected', extractDetails(getRandomItem(data.selected))]
        ];

        console.log('Historical Events:', eduContent);
    } catch (error) {
        console.error(error);
        eduContent = [];
    }
}

function displayCurrentEvent() {
    if (eduContent.length > 0) {
        const prevIndex = (currentIndex - 1 + eduContent.length) % eduContent.length;
        const nextIndex = (currentIndex + 1) % eduContent.length;

        const displayEvent = (index, prefix) => {
            const category = eduContent[index][0];
            const event = eduContent[index][1];
            const contentDiv = document.getElementById(`edu-${prefix}`);
            const bgDiv = document.getElementById(`edu-${prefix}-bg`);

            const displayCategory = category === 'selected' ? 'events' : category;
            
            document.getElementById(`${prefix}-category`).textContent = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
            document.getElementById(`${prefix}-year`).textContent = event.year;
            contentDiv.textContent = event.text;

            if (bgDiv) {
                const event = eduContent[index][1];
                if (event.thumbnail && event.thumbnail !== 'No thumbnail available') {
                    bgDiv.style.backgroundImage = `
                        linear-gradient(to right, rgba(45, 21, 16, 1), rgba(90, 49, 32, 0.8) 100%),
                        url('${event.thumbnail}')
                    `;
                } else {
                    bgDiv.style.backgroundImage = `rgb(90, 49, 32)`;
                }
            }

            let size = parseInt(window.getComputedStyle(contentDiv).fontSize);

            function resize() {
                if (contentDiv.offsetHeight > (bgDiv.offsetHeight) * 0.68) {
                    while (contentDiv.offsetHeight > (bgDiv.offsetHeight) * 0.68) {
                        size--;
                        contentDiv.style.fontSize = size + 'px';
                    }
                }
            }

            const resizeObserver = new ResizeObserver(() => {
                contentDiv.style.fontSize = '';
                size = parseInt(window.getComputedStyle(contentDiv).fontSize);
                resize();
            });

            resizeObserver.observe(contentDiv);
            resizeObserver.observe(bgDiv);
        };

        displayEvent(currentIndex, "current");
        displayEvent(nextIndex, "next");
        displayEvent(prevIndex, "prev");

        document.getElementById("edu-date").textContent = dateString;
    } else {
        console.error("No historical events fetched");
    }
}

const eduSlider = document.getElementById("edu-content-section");
const eduCategory = document.getElementById("edu-category");
const eduYear = document.getElementById("edu-year");

function nextEvent() {
    if (!isAnimating) {
        isAnimating = true;
        eduSlider.style.transition = "0.6s ease";
        eduSlider.style.transform = "translateY(-66.6666%)";
    
        sleep(400).then(() => { 
            eduCategory.style.transition = "0.6s ease";
            eduCategory.style.transform = 'translateY(-66.6666%)';
            eduYear.style.transition = "0.6s ease";
            eduYear.style.transform = 'translateY(-66.6666%)';
            sleep(600).then(() => {
                currentIndex = (currentIndex + 1) % eduContent.length;
                displayCurrentEvent();
                eduCategory.style.transition = "none";
                eduCategory.style.transform = 'translateY(-33.3333%)';
                eduYear.style.transition = "none";
                eduYear.style.transform = 'translateY(-33.3333%)';
                eduSlider.style.transition = "none";
                eduSlider.style.transform = "translateY(-33.3333%)";
                isAnimating = false;
            });
        });
    }
}

function prevEvent() {
    if (!isAnimating) {
        isAnimating = true;
        eduSlider.style.transition = "0.6s ease";
        eduSlider.style.transform = "translateY(0%)";
        
        sleep(400).then(() => { 
            eduCategory.style.transition = "0.6s ease";
            eduCategory.style.transform = 'translateY(0%)';
            eduYear.style.transition = "0.6s ease";
            eduYear.style.transform = 'translateY(0%)';
            sleep(600).then(() => {
                currentIndex = (currentIndex - 1 + eduContent.length) % eduContent.length;
                displayCurrentEvent();
                eduCategory.style.transition = "none";
                eduCategory.style.transform = 'translateY(-33.3333%)';
                eduYear.style.transition = "none";
                eduYear.style.transform = 'translateY(-33.3333%)';
                eduSlider.style.transition = "none";
                eduSlider.style.transform = "translateY(-33.3333%)";
                isAnimating = false;
            });
        });
    }
}

async function initEduContent() {
    await fetchHistoricalEvents();
    displayCurrentEvent();
}

initEduContent();

let startY = 0;
let dragging = false;
let eventTriggered = false;

function handleStart(e) {
    startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    dragging = true;
    eventTriggered = false;
}

function handleMove(e) {
    if (dragging) {
        const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const deltaY = startY - currentY;

        if (deltaY > 10 && !eventTriggered) {
            nextEvent();
            eventTriggered = true;
        } else if (deltaY < -10 && !eventTriggered) {
            prevEvent();
            eventTriggered = true;
        }

        startY = currentY;
    }
}

function handleEnd() {
    dragging = false;
}

// Add mouse event listeners
eduSlider.addEventListener('mousedown', handleStart);
document.addEventListener('mousemove', handleMove);
document.addEventListener('mouseup', handleEnd);

// Add touch event listeners
eduSlider.addEventListener('touchstart', handleStart);
document.addEventListener('touchmove', handleMove);
document.addEventListener('touchend', handleEnd);
