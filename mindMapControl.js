area = document.getElementById("mySvg");
area.addEventListener("mousedown", clickOnSVG);
document.addEventListener("keydown", deleteSelect);

function Group(id,group,shape,fullText,displayText){
  this.id = id
  this.group = group
  this.shape = shape;
  this.outlineRect = null;
  this.fullText = fullText;
  this.displayText = displayText;
  this.links = new Map();

  this.circs = [];
  this.potentialLink = null;
  this.topNode = null;
  this.botNode = null;

}

function Rectangle(rect){
  this.rect = rect;
  this.x = +rect.getAttribute('x');
  this.y = +rect.getAttribute('y');
  this.id = rect.getAttribute('id');
  this.width = +rect.getAttribute('width');
  this.height = +rect.getAttribute('height');
  this.yMid = this.y+(this.height/2);
  this.yEnd = this.y+this.height;
  this.xMid = this.x+(this.width/2);
  this.xEnd = this.x+this.width;
}

function Link(startNode,line,rank) {
  this.startNode = startNode;
  this.line = line;
}

function PotentialLink(parent,line){
  this.connectingToParent = parent;
  this.line = line;
}

let creatingNewShape = false;
let drawingLink = false;
let elementsCreated = 0;

let selected = null;

let posGrabbedX, posGrabbedY
let groupObjects = new Map();
/*
Function that deal with user mousedown interactions
*/

//The user clicks on the svg area but no element
function clickOnSVG(e){
  if (drawingLink){
    endDrawingLink(); 
  
  }else if (creatingNewShape){
    selected.group.addEventListener("mousedown", clickOnElement, false);
    unselect();
    area.onmousemove = null;
    creatingNewShape = false;
  
  }else if (selected != null){
    unselect();

  }else{
    selected = createNewElement(e);
    groupObjects.set(selected.group,selected)
    drawCircles();
    area.onmousemove = (event => drawBox(event,e.pageX,e.pageY));
    elementsCreated++
    creatingNewShape = true;
  }
}

//The user clicks on a shape
function clickOnElement(e) {
  if (creatingNewShape == true){
    return 0;
  }
  e.stopPropagation();
  if (drawingLink == true){
    if (e.currentTarget != selected.group){
      connectBox(e);
    }
    return 0;
  }
  if (selected == null){
    select(e);
  }else if (e.currentTarget != selected.group){
    unselect();
    select(e);
  }
  startMovement(e);
}

function createNewElement(e){
  newGroup = document.createElementNS("http://www.w3.org/2000/svg","g");
  newGroup.setAttribute('id',`g${elementsCreated}`)
  area.appendChild(newGroup);
  newRect = document.createElementNS("http://www.w3.org/2000/svg","rect")
  newRect.setAttribute('id',`rect${elementsCreated}`)
  newRect.setAttribute('x',e.pageX)
  newRect.setAttribute('y',e.pageY)
  newRect.setAttribute('height',"0")
  newRect.setAttribute('width',"0")
  newRect.setAttribute('fill',"white")
  newRect.setAttribute('stroke',"black")
  newGroup.appendChild(newRect);
  fullText = document.createElementNS("http://www.w3.org/2000/svg","text")
  fullText.setAttribute("class","fullText");
  fullText.setAttribute('id',`fullText_rect${elementsCreated}`)
  fullText.innerHTML = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe obcaecati, omnis est recusandae hic possimus consequatur labore in. Esse dicta sunt, molestiae cum velit expedita ipsa cupiditate modi ea iste!";
  newGroup.appendChild(fullText);
  displayText = document.createElementNS("http://www.w3.org/2000/svg","text")
  displayText.setAttribute('id',`text_rect${elementsCreated}`)
  newGroup.appendChild(displayText);

  return new Group(`rect${elementsCreated}`,newGroup, new Rectangle(newRect),fullText,displayText);
}
/*
These functions deal with the process of selecting, unselecting and deleting selected elements
*/
function select(e){
  selected = groupObjects.get(e.currentTarget);
  drawCircles(selected);
  drawLinkNodes(selected);
}

function unselect(){
  removeCircles();
  if (creatingNewShape == false){
    removeLinkNodes();
  }
  selected = null;
}

function deleteSelect(e){
  if (drawingLink == true){
    endDrawingLink();
    return 0;
  }
  if (e.keyCode == 8 && selected != null){
    removeCircles();
    removeText();
    removeAllLinks();
    if (creatingNewShape == false){
      removeLinkNodes();
    }
    selected.group.remove();
    area.onmousemove = null;
    area.onmouseup = null;
    creatingNewShape = false;
    
    selected = null;
  }
}

/**
 * These functions are used for starting and stopping the movement of the text box
 */

function startMovement(e){
  posGrabbedX = e.pageX - selected.shape.x;   
  posGrabbedY = e.pageY - selected.shape.y;   
  
  area.onmousemove = dragElement;
  area.onmouseup = (e => {dragElement(e); dropElement(e)});
}

function dragElement(e) {
  e.preventDefault();
  selected.shape.rect.setAttribute("x", e.pageX - posGrabbedX);
  selected.shape.rect.setAttribute("y", e.pageY - posGrabbedY);
  movedElement();
}

function movedElement(){
  selected.shape = new Rectangle(selected.shape.rect)
  changeText();
  changeCircles();
  if (creatingNewShape == false){
    changeLinkNodes();
  }
  changeLinks();
}

function dropElement() {
  area.onmouseup = null;
  area.onmousemove = null;
}

/*
Functions for creating the element itself
*/
function drawBox(e,origX,origY){
  let width, height;
  let x , y;
  if (origX < e.pageX){
    width = e.pageX - origX;
    x = origX
  }else{
    width = origX - e.pageX;
    x = e.pageX;
  }

  if (origY < e.pageY){
    height = e.pageY - origY
    y = origY
  }else{
    height = origY - e.pageY
    y = e.pageY
  }
  selected.shape.rect.setAttribute("x", x);
  selected.shape.rect.setAttribute("y", y);
  selected.shape.rect.setAttribute("width", width);
  selected.shape.rect.setAttribute("height", height);

  movedElement();
}

/*
* Functions used for creating, moving and deleting circles
 */

function drawCircles(){
  s = selected.shape
  let pos = [[s.x,s.y],[s.x,s.yMid],[s.x,s.yEnd],[s.xMid,s.y],[s.xMid,s.yEnd],[s.xEnd,s.y],[s.xEnd,s.yMid],[s.xEnd,s.yEnd]];
  for (let i = 0; i < 8; i++ ){
    newCirc = '<circle id="'+selected.id+'_'+i+'" r="5" cx="'+pos[i][0]+'" cy="'+pos[i][1]+'" fill="white" stroke="black"/>'
    selected.group.insertAdjacentHTML('beforeend', newCirc);
    selected.circs[i] = document.getElementById(selected.id+"_"+i)
    selected.circs[i].addEventListener("mousedown",expand);
  }
  
}

function changeCircles(){
  s = selected.shape
  let pos = [[s.x,s.y],[s.x,s.yMid],[s.x,s.yEnd],[s.xMid,s.y],[s.xMid,s.yEnd],[s.xEnd,s.y],[s.xEnd,s.yMid],[s.xEnd,s.yEnd]]
  for (let i = 0; i<8; i++){
    selected.circs[i].setAttribute("cx",pos[i][0])
    selected.circs[i].setAttribute("cy",pos[i][1])
  }
}

function removeCircles(){
  for (let i = 0; i < 8; i++){
    selected.circs[i].remove();
    selected.circs[i] = null;
  }
}

/*
* Functions for creating, moving and changing text
*/
function changeText(){
  fullText = document.getElementById("fullText_"+selected.id)
  displayText = document.getElementById("text_"+selected.id)
  displayText.setAttribute('x',selected.shape.x)
  displayText.setAttribute('y',selected.shape.y)
  fitToBox(displayText,fullText);
}

function fitToBox(displayText,fullText){
  let numLines = selected.shape.height / 12
  const lines = []
  let lineLength = selected.shape.width / 8
  let words = fullText.innerHTML.split(" ");

  displayText.innerHTML = "";

  let currLine = 0;
  let currPos = 0;
  let wordLength;
  for (let i = 0; i < words.length; i++){
    wordLength = words[i].length;
    if (currPos + wordLength > lineLength){
      currPos = wordLength
      currLine++
      if (wordLength > lineLength){
      lines[currLine] = "...";
        break;
      }
      lines[currLine] = words[i];
    }else{
      if (currLine == 0 && currPos == 0){
        lines[currLine] = words[i];
      }else{
        lines[currLine] += " " + words[i];
      }
      currPos += wordLength;
    }
  }

  if (lines[0] == undefined){
    return 0;
  }

  let newText;
  for (let i = 0; i <= currLine; i++){
    if (i >= numLines - 1){
      newText = "<tspan dy = '10' dx = '0' x='"+selected.shape.x+"'>...</tspan>";
      displayText.insertAdjacentHTML('beforeend', newText);

      break;
    }
    newText = "<tspan dy = '10' dx = '0' x='"+selected.shape.x+"'>"+lines[i]+"</tspan>";
    displayText.insertAdjacentHTML('beforeend', newText);
  }

}

function removeText(){
  document.getElementById("text_"+selected.id).remove();
  document.getElementById("fullText_"+selected.id).remove();
}

/*
* Functions for creating, moving and removing links
*/

function drawLinkNodes(){
  topBox = `<rect id="${selected.id}_linkParent" width=${selected.shape.width / 2} height="10" x="${selected.shape.x + (selected.shape.width/4)}" y="${selected.shape.y - 15}"fill='red' stroke='black'/>`
  botBox = `<rect id="${selected.id}_linkChild" width=${selected.shape.width / 2} height="10" x="${selected.shape.x + (selected.shape.width/4)}" y="${selected.shape.y +selected.shape.height + 10}"fill='blue' stroke='black'/>`
  
  area.insertAdjacentHTML('beforeend', topBox);
  area.insertAdjacentHTML('beforeend', botBox);

  t = document.getElementById(`${selected.id}_linkParent`)
  t.addEventListener("mousedown",parentConnection);
  selected.topNode = t
  b = document.getElementById(`${selected.id}_linkChild`)
  b.addEventListener("mousedown",childConnection);
  selected.botNode = b
}

function changeLinkNodes(){
  selected.topNode.setAttribute('x',selected.shape.x + (selected.shape.width/4));
  selected.topNode.setAttribute('y',selected.shape.y - 15);
  selected.topNode.setAttribute('width',selected.shape.width / 2);

  selected.botNode.setAttribute('x',selected.shape.x + (selected.shape.width/4));
  selected.botNode.setAttribute('y',selected.shape.y +selected.shape.height + 10);
  selected.botNode.setAttribute('width',selected.shape.width / 2);
}

function removeLinkNodes(){
  selected.topNode.remove();
  selected.topNode = null;
  selected.botNode.remove();
  selected.topNode = null;
}

function createNewLine(id,x1,y1,x2,y2,colour,width){
  newLine = document.createElementNS("http://www.w3.org/2000/svg","line")
  newLine.setAttribute('id',id)
  newLine.setAttribute('x1',x1)
  newLine.setAttribute('y1',y1)
  newLine.setAttribute('x2',x2);
  newLine.setAttribute('y2',y2);
  newLine.setAttribute('stroke',colour)
  newLine.setAttribute('stroke-width',width)
  return newLine;
}

function parentConnection(e){
  drawingLink = true;
  e.stopPropagation();
  newLine = createNewLine(`${selected.id}_line`,selected.shape.xMid,selected.shape.y-15,e.pageX,e.pageY,'red',5);
  area.appendChild(newLine);
  selected.potentialLink = new PotentialLink(true,newLine);

  onmousemove = followMouseWithLine;
}

function childConnection(e){
  drawingLink = true;
  e.stopPropagation();
  newLine = createNewLine(`${selected.id}_line`,selected.shape.xMid,selected.shape.yEnd+15,e.pageX,e.pageY,'blue',5);
  area.appendChild(newLine);
  selected.potentialLink = new PotentialLink(false,newLine);

  onmousemove = followMouseWithLine;
}

function followMouseWithLine(e){
  selected.potentialLink.line.setAttribute('x2',e.pageX)
  selected.potentialLink.line.setAttribute('y2',e.pageY)
}

function connectBox(e){
  drawingLink = false;
  onmousemove = null

  selected.potentialLink.line.remove();

  dest = groupObjects.get(e.currentTarget);

  if (selected.links.get(dest)){
    return;
  }
  colour = 'red'
  width = 5
  
  newLine = createNewLine(`line_${selected.id}_${dest.id}`,selected.shape.xMid,selected.shape.yMid,dest.shape.xMid,dest.shape.yMid,colour,width);
  area.prepend(newLine);

  selected.links.set(dest,new Link(true,newLine));
  dest.links.set(selected,new Link(false,newLine));

}

function endDrawingLink(){
  drawingLink = false;
  selected.potentialLink.line.remove();
  onmousemove = null
}

function changeLinks(){
  for (const x of selected.links.values()) {
    if (x.startNode){
      x.line.setAttribute('x1',selected.shape.xMid);
      x.line.setAttribute('y1',selected.shape.yMid);
    }else{
      x.line.setAttribute('x2',selected.shape.xMid);
      x.line.setAttribute('y2',selected.shape.yMid);
    }
  }
}

function removeAllLinks(){
  for (const x of selected.links.keys()) {
    y = x.links.get(selected);
    y.line.remove();
    x.links.delete(y);
  }
  
}

/*
Functions for changing the size of the given element
*/

function expand(e){
  e.stopPropagation();
  area.onmouseup = dropElement;
  switch(e.target){
    case selected.circs[0]:
      area.onmousemove = e => {expandUp(e) ;expandLeft(e)};
      break;
    case selected.circs[1]:
      area.onmousemove = expandLeft;
      break;
    case selected.circs[2]:
      area.onmousemove = e => {expandDown(e) ;expandLeft(e)};
      break;
    case selected.circs[3]:
      area.onmousemove = expandUp;
      break;
    case selected.circs[4]:
      area.onmousemove = expandDown;
      break;
    case selected.circs[5]:
      area.onmousemove = e => {expandUp(e) ;expandRight(e)};
      break;
    case selected.circs[6]:
      area.onmousemove = expandRight;
      break;
    case selected.circs[7]:
      area.onmousemove = e => {expandDown(e) ;expandRight(e)};
  }
}



function expandLeft(e){
  newX = e.pageX;
  newWidth = selected.shape.width + (selected.shape.x - newX);
  
  if (newWidth >10){
    selected.shape.rect.setAttribute('x',newX);
    selected.shape.rect.setAttribute('width',newWidth);
    movedElement();
  }
}

function expandRight(e){
  newWidth = e.pageX - selected.shape.x;
  
  if (newWidth >10){
    selected.shape.rect.setAttribute('width',newWidth);
    movedElement();
  }
}

function expandUp(e){
  newY = e.pageY;
  newHeight = selected.shape.height + (selected.shape.y - newY); 

  if (newHeight >10){
    selected.shape.rect.setAttribute('y',newY);
    selected.shape.rect.setAttribute('height',newHeight);
    movedElement();
  }
}

function expandDown(e){
  newHeight = e.pageY - selected.shape.y;
  
  if (newHeight >10){
    selected.shape.rect.setAttribute('height',newHeight);
    movedElement();
  }
}

