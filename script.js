let p = document.querySelector('#text')
let spans = document.querySelectorAll('p#text>span');
let firstElement;
let secondElement;

spans.forEach((element) => {
    element.addEventListener('mousedown', (event) => {
        firstElement = event.target;
        console.log(event.target);
    })

    element.addEventListener('mouseup', (event) => {
        secondElement = event.target;
        console.log(event.target);
        if (event.target.previousElementSibling.previousElementSibling == firstElement) {
            console.log(event.target.previousElementSibling.previousElementSibling);
            console.log("BRUUUUUUUUUH");
        }
    })
})

function getSelectionNodes() {
    let selection;
    let selectionText = "";
    if (!(window.getSelection() && window.getSelection()['type'] == 'Range')) { return; }
    selection = document.getSelection();
    console.log(selection.getRangeAt(0))
    selectionText += selection.getRangeAt(0).cloneContents()

    console.log(selection)
    console.log(selectionText.innerHTML)
}