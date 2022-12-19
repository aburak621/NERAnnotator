let p = document.querySelector("#text")
let spans = document.querySelectorAll("p#text span");
let jsonInput = document.querySelector("#jsonFile");
let tagButtons = document.querySelector("div.tags");
let tagInputButton = document.querySelector(".plus-button");
let textInputButton = document.querySelector("#textInputButton");
let outputJSON = document.querySelector("#outputJSON");
let copyOutputButton = document.querySelector("#copyOutputButton");
let plusMinusButtons = document.querySelectorAll(".font-size-button");
let firstElement;
let secondElement;
let startIndex;
let endIndex;
let selection = [];
let selectionText = "";
let colors = ["#E81A0C", "#FE6900", "#FEB912", "#FEDA49", "#AFF218", "#FE7D87", "#E54887", "#F4AFCA", "#9e6dff", "#B0A6E5", "#2C81FB", "#98DD62", "#039C55", "#33A8A1", "#87DBDD", "#5BA6EB"];
shuffleArray(colors);
let currentColorIndex = 2;
let tags = [{ "tag": "PERSON", "color": colors[0] }, { "tag": "ORG", "color": colors[1] }];
let currentTag = tags[0];
let entities = [];

addEventsToSpans();
updateTagButtons();

plusMinusButtons.forEach((button) => {
    button.addEventListener("mousedown", () => {
        button.classList.add("clicked");
    })
    button.addEventListener("mouseup", () => {
        button.classList.remove("clicked");
    })
    button.addEventListener("mouseleave", () => {
        button.classList.remove("clicked");
    })
})

document.querySelector("#font-size-minus").addEventListener("mousedown", (event) => {
    let currentSize = window.getComputedStyle(p).getPropertyValue("font-size");
    currentSize = parseInt(currentSize);
    p.style.fontSize = (currentSize - 1) + "px";
})

document.querySelector("#font-size-plus").addEventListener("mousedown", (event) => {
    let currentSize = window.getComputedStyle(p).getPropertyValue("font-size");
    currentSize = parseInt(currentSize);
    p.style.fontSize = (currentSize + 1) + "px";
})

tagInputButton.addEventListener("mousedown", () => {
    addTag();
})

textInputButton.addEventListener("mousedown", () => {
    let textInput = document.querySelector("#textInput").value;
    createHTMLFromInput(textInput);
    entities = [];
})

// Handle JSON upload.
jsonInput.addEventListener("change", function () {
    let fr = new FileReader();
    fr.onload = function () {
        let json = JSON.parse(fr.result);
        // Update content and variables according to the JSON.
        createHTMLFromInput(json["text"]);
        entities = json["entities"];
        spans = document.querySelectorAll("p#text span");
        // Add new tags to the tags list
        entities.forEach((entity) => {
            if (!tags.some(e => e["tag"] == entity["tag"])) {
                let newTag = { "tag": entity["tag"], "color": colors[currentColorIndex % colors.length] };
                tags.push(newTag);
                currentColorIndex++;
            };
            startIndex = entity["startIndex"];
            endIndex = entity["endIndex"];
            tags.every((tag) => {
                if (tag["tag"] == entity["tag"]) {
                    currentTag = tag;
                    return false;
                }
                return true;
            })
            changeTaggedTextBackground(startIndex, endIndex, currentTag)
        })
        exportAsJSON();
        updateTagButtons();
    }
    fr.readAsText(this.files[0]);
})

copyOutputButton.addEventListener("mousedown", () => {
    navigator.clipboard.writeText(outputJSON.value);
    alert("Copied JSON to clipboard.");
})

// Ability to add new tags.
function addTag() {
    let tag = document.querySelector("#tagInput").value.trim().toUpperCase();
    if (tag == "") {
        alert("Please enter a tag.");
        return;
    }
    if (!tags.some(e => e["tag"] == tag)) {
        let newTag = { "tag": tag, "color": colors[currentColorIndex % colors.length] };
        tags.push(newTag);
        currentColorIndex++;
        updateTagButtons();
    }
}

// Events for selecting and tagging elements with mouse.
function addEventsToSpans() {
    spans = document.querySelectorAll("p#text span");
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

function createHTMLFromInput(text) {
    p.innerHTML = "";
    let elements = text.split(" ");
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
        tagButton.appendChild(document.createTextNode(tag["tag"]));
        tagButton.id = tag["tag"].toLowerCase();
        tagButton.classList.add("tag");
        tagButton.style.backgroundColor = tag["color"];
        tagButton.addEventListener("mousedown", (event) => {
            tags.every((tag) => {
                if (tag["tag"] == event.target.innerText) {
                    currentTag = tag;
                    return false;
                }
                return true;
            })
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
    let deleted = false;
    if (overlappedEntitiesToBeDeleted.length != 0) {
        deleted = true;
    }
    overlappedEntitiesToBeDeleted.reverse().forEach((index) => {
        removeTagNameElement(index);
        let spanIndex = entities[index]["startIndex"];
        spans[spanIndex].parentNode.replaceWith(...spans[spanIndex].parentNode.childNodes);
        entities.splice(index, 1);
    })
    if (deleted) {
        if (startIndex == endIndex) {
            return;
        }
    }

    // Add the new tag to entities.
    let entity = { "text": selectionText, "startIndex": startIndex, "endIndex": endIndex, "tag": currentTag["tag"] };
    entities.push(entity);
    changeTaggedTextBackground(startIndex, endIndex, currentTag)
    clearSelection();
}

function changeTaggedTextBackground(startIndex, endIndex, tag) {
    let newParent = document.createElement("b");
    // let newParent = document.createElement("div");
    // newParent.style.display = "inline-block";
    newParent.style.backgroundColor = tag["color"];
    newParent.style.borderRadius = "8px";
    newParent.style.padding = "3px";
    spans[startIndex].parentNode.insertBefore(newParent, spans[startIndex]);
    for (let i = startIndex; i <= endIndex; i++) {
        newParent.appendChild(spans[i]);
        newParent.innerHTML += " ";
    }
    spans = document.querySelectorAll("p#text span");
    newParent.childNodes.forEach((child) => {
        child.addEventListener("mousedown", (event) => {
            firstElement = event.target;
        })

        child.addEventListener("mouseup", (event) => {
            secondElement = event.target;
            getSelectedElements();
            applyTag();
            exportAsJSON();
        })
    })
    addTagNameText(tag, endIndex, newParent);
}

function addTagNameText(tag, endIndex, newParent) {
    let tagElement = document.createElement("b");
    tagElement.appendChild(document.createTextNode(tag["tag"]));
    tagElement.style.fontSize = "10px";
    newParent.appendChild(tagElement);
}

function removeTagNameElement(indexInEntities) {
    let lastElement = spans[entities[indexInEntities]["endIndex"]];
    lastElement.parentNode.removeChild(lastElement.parentNode.lastChild);
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
    // TODO: Look at the regex.
    var regex = /[!"#$%&"()*+,-./:;<=>?@[\]^_`{|}~]$/;
    selectionText = selectionText.trim();
    selectionText = selectionText.replace(regex, "");
}

// Create the final JSON to be exported.
function exportAsJSON() {
    let text = "";
    spans.forEach((span) => {
        text += span.innerText + " ";
    })
    json = { "text": text.trim(), "entities": entities };
    json = JSON.stringify(json, null, 2);
    outputJSON.textContent = json;
    console.log(json);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function clearSelection() {
    window.getSelection().removeAllRanges();
    if (document.selection) { document.selection.empty(); }
}