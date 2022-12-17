let p = document.querySelector("#text")
let spans = document.querySelectorAll("p#text>span");
let jsonInput = document.querySelector("#jsonFile");
let tagButtons = document.querySelector("div.tags");
let tagInput = document.querySelector("#tagInputButton");
let firstElement;
let secondElement;
let startIndex;
let endIndex;
let selection = [];
let selectionText = "";
let tags = ["PERSON", "ORG"];
let currentTag = tags[0];
let entities = [];


addEventsToSpans();
updateTagButtons();


tagInput.addEventListener("mousedown", (event) => {
    addTag();
})

// Handle JSON upload.
jsonInput.addEventListener("change", function () {
    let fr = new FileReader();
    fr.onload = function () {
        let json = JSON.parse(fr.result);
        // Update content and variables according to the JSON.
        createHTMLFromJSON(json);
        entities = json["entities"];
        // Add new tags to the tags list
        entities.forEach((entity) => {
            if (!tags.includes(entity["tag"])) {
                tags.push(entity["tag"]);
            };
        })
        updateTagButtons();
    }
    fr.readAsText(this.files[0]);
})


// TODO: Ability to add new tags.
function addTag() {
    let tag = document.querySelector("#tagInput").value.toUpperCase();
    if (!tags.includes(tag)) {
        tags.push(tag);
        updateTagButtons();
    }
}
// TODO: Only text input.

// Events for selecting and tagging elements with mouse.
function addEventsToSpans() {
    spans = document.querySelectorAll("p#text>span");
    spans.forEach((element) => {
        element.addEventListener("mousedown", (event) => {
            firstElement = event.target;
        })

        element.addEventListener("mouseup", (event) => {
            secondElement = event.target;
            getSelectedElements();
            applyTag();
            exportAsJSON();
        })
    })
}

function createHTMLFromJSON(json) {
    p.innerHTML = "";
    let elements = json["text"].split(" ");
    elements.forEach((element) => {
        let span = document.createElement("span");
        span.appendChild(document.createTextNode(element));
        p.appendChild(span);
        p.innerHTML += " ";
    })
    addEventsToSpans();
}

function updateTagButtons() {
    tagButtons.innerHTML = "";
    let isFirstItem = true;
    tags.forEach((tag) => {
        let tagButton = document.createElement("div");
        tagButton.appendChild(document.createTextNode(tag));
        tagButton.id = tag.toLowerCase();
        tagButton.classList.add("tag");
        tagButton.addEventListener("mousedown", (event) => {
            currentTag = tagButton.innerText;
            tagButtons.childNodes.forEach((button) => {
                button.classList.remove("selected");
            })
            tagButton.classList.add("selected");
        })
        if (isFirstItem) {
            tagButton.classList.add("selected");
            isFirstItem = false;
        }
        tagButtons.appendChild(tagButton);
    })
    currentTag = tags[0];
}

// Apply currently selected tag to the highlighted elements. If it overlaps with other tags deleted those other tags.
function applyTag() {
    let overlappedEntitiesToBeDeleted = [];
    for (let i = 0; i < entities.length; i++) {
        if (Math.max(startIndex, entities[i]["startIndex"]) <= Math.min(endIndex, entities[i]["endIndex"])) {
            overlappedEntitiesToBeDeleted.push(i);
        }
    }
    overlappedEntitiesToBeDeleted.reverse().forEach((index) => {
        entities.splice(index, 1);
    })

    // Add the new tag to entities.
    let entity = { "text": selectionText, "startIndex": startIndex, "endIndex": endIndex, "tag": currentTag };
    entities.push(entity);
}

// Get the selected elements and update the variables for tagging.
function getSelectedElements() {
    selection = [];
    selectionText = "";

    for (let i = 0; i < spans.length; i++) {
        if (spans[i] == firstElement) {
            startIndex = i;
        } if (spans[i] == secondElement) {
            endIndex = i;
        }
    }

    if (startIndex > endIndex) {
        [startIndex, endIndex] = [endIndex, startIndex];
    }

    for (let i = startIndex; i <= endIndex; i++) {
        selection.push(spans[i]);
        selectionText += spans[i].textContent + " ";
    }
    // Strip the punctuations and trim the corner space. Stripping punctuations might change!.
    var regex = /[!"#$%&"()*+,-./:;<=>?@[\]^_`{|}~]/g;
    selectionText = selectionText.replace(regex, "");
    selectionText = selectionText.trim();
}

// Create the final JSON to be exported.
function exportAsJSON() {
    json = { "text": p.innerText, "entities": entities };
    json = JSON.stringify(json, null, 2);
    console.log(json);
}