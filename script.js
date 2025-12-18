// Version 12/16/2025
function testa() {
    document.getElementById("demo").innerHTML = "<a>test successful</a>";
}
function testh1() {
    document.getElementById("demo").innerHTML = "<h1>test successful</h1>";
}
function testdelete() {
    document.getElementById("demo").innerHTML = "<h2 class='counter' id='demo'></h2>";
}
function hide(list) {
    for (let a = 0; a < list.length; a++) {
        document.querySelectorAll(list[a]).forEach(element => {
        element.style.display = "none";
        });
    }
}
let jstestcount = 1
function jstest() {
    document.getElementById("jstest").innerText = "Test #" + jstestcount + " Successful.";
    jstestcount += 1;
    refreshDate('untilChristmas', 2025, 12, 25, 'Christmas');
    refreshDate('untilNewYears', 2026, 1, 1, 'New Years');
    refreshDate('untilValentines', 2026, 2, 14, 'Valentines Day');
    refreshDate('untilChineseNewYears', 2026, 2, 17, 'Chinese New Years');
}
function addCounter() {
    counter = Number(counter);
    counter += 1;
    localStorage.setItem("Counter", counter);
    showCounter = counter;
    if (commaCounterStatus === true) {
        showCounter = commaNumber(showCounter)
    };
    document.getElementById("counterDisplay").innerText = showCounter;
}
function minusCounter() {
    counter -= 1;
    localStorage.setItem("Counter", counter);
    showCounter = counter;
    if (commaCounterStatus === true) {
        showCounter = commaNumber(showCounter)
    };
    document.getElementById("counterDisplay").innerText = showCounter;
}
function resetCounter() {
    counter = 0;
    localStorage.setItem("Counter", 0);
    showCounter = counter;
    if (commaCounterStatus === true) {
        showCounter = commaNumber(showCounter)
    };
    document.getElementById("counterDisplay").innerText = showCounter;
}
function commaCounter() {
    if (commaCounterStatus === false) {
        commaCounterStatus = true
    } else if (commaCounterStatus) {
        commaCounterStatus = false
    } else {
        console.log("Variable commaCounterStatus has not given a value that is true or false.")
    }
    showCounter = counter;
    if (commaCounterStatus === true) {
        showCounter = commaNumber(showCounter)
    };
    document.getElementById("counterDisplay").innerText = showCounter;
}
function mod(number, dividing) {
    let a = number / dividing
    let b = a
    while (a >= 0) {
        b = a
        a -= 1
    }
    return b
}
function flip(number) {
    let a = 0
    let newNumber = ''
    number = String(number)
    while (a < number.length) {
        newNumber += number[number.length - a - 1]
        a += 1
    }
    return newNumber
}
function commaNumber(oldNumber) {
    let a = 0
    let newNumber = ''
    a = 0
    oldNumber = flip(String(oldNumber))
    while (a < oldNumber.length) {
        if (mod(a, 3) == 0 && a != 0) {
            newNumber += ','
        }
        newNumber += oldNumber[a]
        a += 1
    }
    return flip(newNumber)
}
function disableCounterPreset() {
    if (document.getElementById("counterForm").style.display == "none") {
        document.getElementById("counterSettings").style.display = "";
        document.getElementById("counterForm").style.display = "";
        document.getElementById("disableCounter").innerText = "Click to disable counter settings";
    }
    else if (document.getElementById("counterForm").style.display == "") {
        document.getElementById("counterSettings").style.display = "none";
        document.getElementById("counterForm").style.display = "none";
        document.getElementById("disableCounter").innerText = "Click to enable counter settings";
    }
}
//Check and update mode (Not set dark mode)
function darkmode() {
    if (localStorage.getItem('lightmode') === 'dark') {
        document.querySelectorAll('*').forEach(Element => {Element.className += " darkmode"});
        console.log('Darkmode Enabled.');
    } else if (localStorage.getItem('lightmode') === 'light') {
        document.querySelectorAll('*').forEach(element => {element.classList.remove('darkmode')});
        console.log('Lightmode Enabled.');
    }
}
//Response to the light mode/dark mode button being clicked (Not set light mode)
function lightmode() {
    if (localStorage.getItem('lightmode') === 'dark') {
        localStorage.setItem('lightmode', 'auto')
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            if (document.getElementById('darktest').className == 'footer') {
                document.querySelectorAll('*').forEach(Element => {Element.className += " darkmode"});
            }
        } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
            if (document.getElementById('darktest').className == 'footer darkmode') {
                document.querySelectorAll('*').forEach(element => {
                element.classList.remove('darkmode');
                });
            }
        }
        console.log("Auto Change Enabled")
    } else if (localStorage.getItem('lightmode') === 'auto') {
        localStorage.setItem('lightmode', 'light')
    } else if (localStorage.getItem('lightmode') === 'light') {
        localStorage.setItem('lightmode', 'dark')
    }
    darkmode();
    document.getElementById('lightmode').innerHTML = 'Current Mode: ' + localStorage.getItem('lightmode');
}
function refreshDate(elementId, year, month, day, subject) {
    const now = new Date();
    now.setHours(0,0,0,0);
    const goal = new Date(year, month - 1, day);
    const until = (goal - now)/1000/60/60/24;
    document.getElementById(elementId).innerText = subject + " (" + month + "/" + day + "/" + year + "): in " + until + " days" ;
}
function showAlert(message) {
    const box = document.createElement("div");
    const content = document.createElement("p");
    const button = document.createElement("button");

    box.id = "customAlert";
    content.id = "alertMessage";
    button.id = "alertClose";

    content.innerText = message;
    button.innerText = "OK";

    button.onclick = () => {
        document.getElementById("customAlert").remove();
    };

    box.append(content, button);
    document.getElementById("main").after(box);
};
window.showAlert = showAlert;
function manageCookies(status) {
    if (status === true) {
        console.log("Cookies Accepted.");
        localStorage.setItem("Cookies", true);
    } else if (status === false) {
        console.log("Cookies Declined.")
        localStorage.setItem("Cookies", false)
    } else {
        console.log(`When calling function manageCookies in script.js, status gave the value: ${status} instead of true or false.`)
    };
    if (document.getElementById("cookies") !== null) {
        document.getElementById("cookies").remove();
    };
}
function addCookiesBar() {
    const textContent = `
        Your perference will be stored until you clear your browser's cache. 
        By clicking accept, you also accept to the `
    const box = document.createElement("div");
    const heading = document.createElement("h2");
    const text = document.createElement("p");
    const privacyLink = document.createElement("a");
    const acceptButton = document.createElement("button");
    const declineButton = document.createElement("button");

    heading.innerText = 'This website uses cookies.';
    text.innerText = textContent;
    privacyLink.innerText = 'privacy policy';
    privacyLink.href = '/privacy.html';
    acceptButton.innerText = 'Accept';
    declineButton.innerText = 'Decline';

    acceptButton.addEventListener('click', () => manageCookies(true));
    declineButton.addEventListener('click', () => manageCookies(false));

    box.id = 'cookies';
    heading.className = 'cookieheading';
    acceptButton.className = 'cookiebutton';
    declineButton.className = 'cookiebutton';

    text.append(privacyLink, '.', document.createElement("br"), acceptButton, declineButton);
    box.append(heading, text);
    document.getElementById("main").after(box);
};
// Initial check
if (localStorage.getItem('lightmode') === 'auto' || localStorage.getItem('lightmode') === null) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) { 
        if (document.getElementById('darktest').className == 'footer') {
            document.querySelectorAll('*').forEach(Element => {Element.className += " darkmode"});
            console.log('Darkmode Enabled.');
        }
    } 
    else if (document.getElementById('darktest').className == 'footer darkmode'){
        document.querySelectorAll('*').forEach(element => {
        element.classList.remove('darkmode');
        console.log('Lightmode Enabled.');
        });
    }
    localStorage.setItem('lightmode', 'auto');
} else {
    darkmode();
    console.log(localStorage.getItem('lightmode'))
}
if (document.getElementById('lightmode') !== null) {
    document.getElementById('lightmode').innerHTML = 'Current Mode: ' + localStorage.getItem('lightmode');
};
if (localStorage.getItem('Cookies') == null) {
    addCookiesBar();
};

console.log('Cookies Status: ' + localStorage.getItem('Cookies'))

if (localStorage.getItem("Counter") === null) {
    localStorage.setItem("Counter", 0);
}
let counter = 0
if (document.getElementById("counterDisplay") !== null) {
    document.getElementById("counterDisplay").innerText = localStorage.getItem("Counter");
    counter = Number(localStorage.getItem("Counter"));
    console.log("Counter status:", counter)
}
let commaCounterStatus = false

// Listen for changes if auto
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (localStorage.getItem('lightmode') == 'auto') {
        if (event.matches) {
            if (document.getElementById('darktest').className == 'footer') {
                document.querySelectorAll('*').forEach(Element => {Element.className += " darkmode"});
                console.log('Darkmode Enabled.');
            }
        } else {
        if (document.getElementById('darktest').className == 'footer darkmode') {
            document.querySelectorAll('*').forEach(element => {
            element.classList.remove('darkmode');
            console.log('Lightmode Enabled.')
            });
        }
        }
    }
})
if (document.getElementById('counterForm') !== null) {
    //Counter form submit detection
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('counterForm').addEventListener('submit', (event) => {
            event.preventDefault();
            if (document.getElementById('presetCounter').value.length !== 0) {
                counter = document.getElementById('presetCounter').value;
                localStorage.setItem("Counter", counter)
                showCounter = localStorage.getItem("Counter");
                if (commaCounterStatus === true) {
                    showCounter = commaNumber(showCounter)
                };
                document.getElementById("counterDisplay").innerText = showCounter;    
            } else {
                console.log("Entered string is empty. Please enter a number.")
            }
            document.getElementById('counterForm').reset();
        });
    });
}
if (document.getElementById("jstest") !== null) {
    jstest();
};
console.log("Initial Code Completed.");