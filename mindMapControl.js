area = document.getElementById("mySvg");
area.addEventListener("mousedown", newElement);
document.addEventListener("keydown", deleteSelect);

let growing = false;
let count = 0;
let selected = null;
let selectAtt = {};
let posGrabbedX, posGrabbedY
const circs = [] 
let start;
let connecting = false;
let mindGraph = new Map([]);

function newElement(e){
  if (connecting == true){
    removeLine();
    return 0;
  }
  if (selected != null && growing == false){
    unselect();
  }else if (!growing){
    let newElement = createNewElement(e);
    start = [e.pageX, e.pageY];
    area.insertAdjacentHTML('beforeend', newElement);
    selected = document.getElementById("rect"+count)
    selectAtt = getAttributes(selected);
    mindGraph.set(selected,new Map([]));
    drawCircles();
    area.onmousemove = drawBox;
    count++
    growing = true;
  }else{
    document.getElementById("g_"+(count-1)).addEventListener("mousedown", clickOnElement, false);
    unselect();
    area.onmousemove = null;
    growing = false;
  }
}

function select(e){
  selected = e.currentTarget.firstChild;
  selectAtt = getAttributes(selected);
  drawCircles(selected);
  drawLinkBoxes(selected);
}

function unselect(){
  removeCircles();
  if (growing == false){
    removeLinkBoxes();
  }
  selectAtt = null;
  selected = null;
}

function deleteSelect(e){
  if (e.keyCode == 8 && selected != null){
    removeCircles();
    removeText();
    removeAllLinks();
    if (growing == false){
      removeLinkBoxes();
    }
    selected.parentNode.remove();
    area.onmousemove = null;
    growing = false;
    

    selected.remove();
    selected = null;
    selectAtt = null;
  }
}

function removeAllLinks(){
  allConnections = mindGraph.get(selected);
  for (const x of allConnections.keys()) {
    curr = mindGraph.get(x);
    y = curr.get(selected);
    y.line.remove();
    curr.delete(y);
  }
  allConnections.delete(selected);
}

function getAttributes(curr){
  let obj = {
    x : +curr.getAttribute('x'),
    y : +curr.getAttribute('y'),
    id : curr.getAttribute('id'),
    width : +curr.getAttribute('width'),
    height : +curr.getAttribute('height'),
    yEnd : this.y+this.height,
    xMid : this.x+(this.width/2),
    xEnd : this.x+this.width,
  }

  obj.yMid = obj.y+(obj.height/2);
  obj.yEnd = obj.y+obj.height;
  obj.xMid = obj.x+(obj.width/2);
  obj.xEnd = obj.x+obj.width;
  
  return obj;
  
}

function createNewElement(e){
return "<g id='g_"+count+"'>"+"<rect id='rect"+count+"' width = '0' height = '0' x='"+e.pageX+"' y='"+e.pageY+"' fill='white' stroke='black'/>"
+"<text class ='fullText' id='fullText_rect"+count+"' x='"+e.pageX+"' y = '"+e.pageY+"'>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Commodi distinctio error provident quo unde, ipsam id cumque reiciendis aut porro incidunt quis ipsum perspiciatis illum dolores obcaecati blanditiis. Culpa, delectus?</text>"
+"<text id='text_rect"+count+"' x='"+e.pageX+"' y = '"+e.pageY+"'></text>"
+"</g>"
}


function clickOnElement(e) {
    if (growing == true){
      return 0;
    }
    e.stopPropagation();
    if (connecting == true){
      if (e.currentTarget.firstChild != selected){
        connectBox(e);
      }
      return 0;
    }
    if (selected == null){
      select(e);
    }else if (e.currentTarget.firstChild != selected){
      unselect();
      select(e);
    }
    startMovement(e);
}

function startMovement(e){
  posGrabbedX = e.pageX - selectAtt.x;   
  posGrabbedY = e.pageY - selectAtt.y;   
  
  area.onmousemove = dragElement;
  area.onmouseup = (e => {dragElement(e); dropElement(e)});
}

function dragElement(e) {
  e.preventDefault();
  selected.setAttribute("x", e.pageX - posGrabbedX);
  selected.setAttribute("y", e.pageY - posGrabbedY);
  movedElement();
}

function movedElement(){
  selectAtt = getAttributes(selected);
  changeText();
  changeCircles();
  if (growing == false){
    changeLinkBoxes();
  }
  changeLinks();
}

function dropElement() {
  area.onmouseup = null;
  area.onmousemove = null;
  
}

function changeLinks(){
  allConnections = mindGraph.get(selected);
  for (const x of allConnections.values()) {
    if (x.startNode){
      x.line.setAttribute('x1',selectAtt.xMid);
      x.line.setAttribute('y1',selectAtt.yMid);
    }else{
      x.line.setAttribute('x2',selectAtt.xMid);
      x.line.setAttribute('y2',selectAtt.yMid);
    }
  }

}

function changeText(){
  fullText = document.getElementById("fullText_"+selectAtt.id)
  displayText = document.getElementById("text_"+selectAtt.id)
  displayText.setAttribute('x',selectAtt.x)
  displayText.setAttribute('y',selectAtt.y)
  fitToBox(displayText,fullText);
}

function fitToBox(displayText,fullText){
  let numLines = selectAtt.height / 12
  const lines = []
  let lineLength = selectAtt.width / 8
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
      newText = "<tspan dy = '10' dx = '0' x='"+x+"'>...</tspan>";
      displayText.insertAdjacentHTML('beforeend', newText);

      break;
    }
    newText = "<tspan dy = '10' dx = '0' x='"+x+"'>"+lines[i]+"</tspan>";
    displayText.insertAdjacentHTML('beforeend', newText);
  }

}

function removeText(){
  document.getElementById("text_"+selectAtt.id).remove();
  document.getElementById("fullText_"+selectAtt.id).remove();
}

function drawBox(e){
  let width, height;
  let x , y;
  if (start[0] < e.pageX){
    width = e.pageX - start[0];
    x = start[0]
  }else{
    width = start[0] - e.pageX;
    x = e.pageX;
  }

  if (start[1] < e.pageY){
    height = e.pageY - start[1]
    y = start[1]
  }else{
    height = start[1] - e.pageY
    y = e.pageY
  }
  selected.setAttribute("x", x);
  selected.setAttribute("y", y);
  selected.setAttribute("width", width);
  selected.setAttribute("height", height);

  movedElement();
}

function drawCircles(){
  x = selectAtt.x
  y = selectAtt.y
  yMid = selectAtt.yMid
  yEnd = selectAtt.yEnd
  xMid = selectAtt.xMid
  xEnd = selectAtt.xEnd

  let pos = [[x,y],[x,yMid],[x,yEnd],[xMid,y],[xMid,yEnd],[xEnd,y],[xEnd,yMid],[xEnd,yEnd]];
  for (let i = 0; i < 8; i++ ){
    newCirc = '<circle id="'+selectAtt.id+'_'+i+'" r="5" cx="'+pos[i][0]+'" cy="'+pos[i][1]+'" fill="white" stroke="black"/>'
    area.insertAdjacentHTML('beforeend', newCirc);
    circs[i] = document.getElementById(selectAtt.id+"_"+i)
    circs[i].addEventListener("mousedown",expand);
  }
  
}

function changeCircles(){
  x = selectAtt.x
  y = selectAtt.y
  yMid = selectAtt.yMid
  yEnd = selectAtt.yEnd
  xMid = selectAtt.xMid
  xEnd = selectAtt.xEnd

  let pos = [[x,y],[x,yMid],[x,yEnd],[xMid,y],[xMid,yEnd],[xEnd,y],[xEnd,yMid],[xEnd,yEnd]]
  
  for (let i = 0; i<8; i++){
    circs[i].setAttribute("cx",pos[i][0])
    circs[i].setAttribute("cy",pos[i][1])
  }
 
}

function removeCircles(){
  for (let i = 0; i < 8; i++){
    circs[i].remove();
    circs[i] = null;
  }
}

function drawLinkBoxes(){
  topBox = `<rect id="${selectAtt.id}_linkParent" width=${selectAtt.width / 2} height="10" x="${selectAtt.x + (selectAtt.width/4)}" y="${selectAtt.y - 15}"fill='red' stroke='black'/>`
  botBox = `<rect id="${selectAtt.id}_linkChild" width=${selectAtt.width / 2} height="10" x="${selectAtt.x + (selectAtt.width/4)}" y="${selectAtt.y +selectAtt.height + 10}"fill='blue' stroke='black'/>`
  
  area.insertAdjacentHTML('beforeend', topBox);
  area.insertAdjacentHTML('beforeend', botBox);

  document.getElementById(`${selectAtt.id}_linkParent`).addEventListener("mousedown",linkBox);
  document.getElementById(`${selectAtt.id}_linkChild`).addEventListener("mousedown",linkBox);
}

function changeLinkBoxes(){
  topBox = document.getElementById(`${selectAtt.id}_linkParent`);
  topBox.setAttribute('x',selectAtt.x + (selectAtt.width/4));
  topBox.setAttribute('y',selectAtt.y - 15);
  topBox.setAttribute('width',selectAtt.width / 2);

  botBox = document.getElementById(`${selectAtt.id}_linkChild`);
  botBox.setAttribute('x',selectAtt.x + (selectAtt.width/4));
  botBox.setAttribute('y',selectAtt.y +selectAtt.height + 10);
  botBox.setAttribute('width',selectAtt.width / 2);
}

function removeLinkBoxes(){
  document.getElementById(`${selectAtt.id}_linkParent`).remove();
  document.getElementById(`${selectAtt.id}_linkChild`).remove();
}

function linkBox(e){
  connecting = true;
  e.stopPropagation();
  let newLine = "<line id='line_"+selectAtt.id+"' x1='"+selectAtt.xMid+"' y1='"+selectAtt.yMid+"' x2='"+e.pageX+"' y2='"+e.pageY+"'>";
  area.insertAdjacentHTML('beforeend', newLine);

  onmousemove = drawLine;
}

function drawLine(e){
  line = document.getElementById("line_"+selectAtt.id)
  line.setAttribute('x2',e.pageX)
  line.setAttribute('y2',e.pageY)
}

function Link(startNode,line) {
  this.startNode = startNode;
  this.line = line;
}

function connectBox(e){
  connecting = false;
  onmousemove = null

  let line = document.getElementById("line_"+selectAtt.id);
  line.remove();

  dest = e.currentTarget.firstChild;

  links = mindGraph.get(selected);
  if (links.get(dest)){
    return 0;
  }


  destAtt = getAttributes(dest);
  
  let newLine = "<line id='line_"+selectAtt.id+"_"+destAtt.id+"' x1='"+selectAtt.xMid+"' y1='"+selectAtt.yMid+"' x2='"+destAtt.xMid+"' y2='"+destAtt.yMid+"'>";
  area.insertAdjacentHTML('afterbegin', newLine);

  let lineCreated = document.getElementById("line_"+selectAtt.id+"_"+destAtt.id);
  links = mindGraph.get(selected);
  links.set(dest,new Link(true,lineCreated));
  links = mindGraph.get(dest);
  links.set(selected,new Link(false,lineCreated));

}

function removeLine(){
  connecting = false;
  let line = document.getElementById("line_"+selectAtt.id);
  line.remove();
  onmousemove = null
}

function expand(e){
  e.stopPropagation();
  area.onmouseup = dropElement;
  if (e.target == circs[0]){
    area.onmousemove = e => {expandUp(e) ;expandLeft(e)};
  }else if (e.target == circs[1]){
    area.onmousemove = expandLeft;
  }else if (e.target == circs[2]){
    area.onmousemove = e => {expandDown(e) ;expandLeft(e)};
  }else if (e.target == circs[3]){
    area.onmousemove = expandUp;
  }else if (e.target == circs[4]){
    area.onmousemove = expandDown;
  }else if (e.target == circs[5]){
    area.onmousemove = e => {expandUp(e) ;expandRight(e)};
  }else if (e.target == circs[6]){
    area.onmousemove = expandRight;
  }else if (e.target == circs[7]){
    area.onmousemove = e => {expandDown(e) ;expandRight(e)};
  }
}



function expandLeft(e){
  newX = e.pageX;
  newWidth = selectAtt.width + (selectAtt.x - newX);
  
  if (newWidth >10){
    selected.setAttribute('x',newX);
    selected.setAttribute('width',newWidth);
    movedElement();
  }
}

function expandRight(e){
  newWidth = e.pageX - selectAtt.x;
  
  if (newWidth >10){
    selected.setAttribute('width',newWidth);
    movedElement();
  }
}

function expandUp(e){
  newY = e.pageY;
  newHeight = selectAtt.height + (selectAtt.y - newY); 

  if (newHeight >10){
    selected.setAttribute('y',newY);
    selected.setAttribute('height',newHeight);
    movedElement();
  }
}

function expandDown(e){
  newHeight = e.pageY - selectAtt.y;
  
  if (newHeight >10){
    selected.setAttribute('height',newHeight);
    movedElement();
  }
}

