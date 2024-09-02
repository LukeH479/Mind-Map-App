const colourArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

area = document.getElementById("mySvg");
area.addEventListener("mousedown", clickOnSVG);
document.addEventListener("keydown", deleteSelect);

inputBox = document.getElementById('inputBox');
endWritinginInputForm();


inputBox.addEventListener('blur',function(){
  document.addEventListener("keydown", deleteSelect);
});

inputBox.addEventListener('focus',function(){
  document.removeEventListener("keydown", deleteSelect);
});


const form = document.querySelector('form'); 
 
form.addEventListener('submit', function(event) { 
  event.preventDefault(); 
  if (selected && selected instanceof Group){
    selected.text.fullText = inputBox.value
    selected.text.recalculate(selected.shape);
  }
});

class Tree{
  constructor(group){
    this.root = group 
    selected.unselect();
    this.descendants = []
    this.traverseTree(group);
  }

  traverseTree(node){
    this.descendants.push(node);
    for (const x of node.children.entries()) {
      this.descendants.push(x[1])
      this.traverseTree(x[0])
    }
  }

  select(){
    for (const x of this.descendants){
      x.select();
    }
    endWritinginInputForm();
  }

  unselect(){
    for (const x of this.descendants){
      x.unselect();
    }
  }

  deleteSelect(){
    for (const x of this.descendants){
      x.deleteSelect();
    }
  }

  dragElement(e){
    for (const x of this.descendants){
      x.lastGrabbed[0] = this.lastGrabbed[0];
      x.lastGrabbed[1] = this.lastGrabbed[1];
      x.dragElement(e);
    }
    this.lastGrabbed = [e.pageX,e.pageY]
  }

}







class Group{
  constructor(id,group,shape,fullText,displayText){
    this.id = id
    this.group = group
    this.shape = shape;
    
    this.text = new elementText(this.shape,fullText,displayText);
    this.outlineRect = null;
    this.floatingBoxes = []

    this.parent = null;
    this.tier = 0;
    this.children = new Map();

    this.circles = [];
    this.potentialLink = null;
    this.lastGrabbed = [];
  }

  drawBox(e,origX,origY){
    //This method of box creation was choosen as we want to ensure a minimum size of element
    let adjX = adjustX(e.pageX);
    let adjY = adjustY(e.pageY);
    if (origX < adjX){
      this.shape.expandRight(e);
    }else{
      this.shape.expandLeft(e);
    }
  
    if (origY < adjY){
      this.shape.expandDown(e);
    }else{
      this.shape.expandUp(e);
    }

    this.resizedElement(this);
  
  }

  select() {
    this.drawCircles();
    this.floatingBoxes.push(new NodeForParentConnections(this.shape));
    this.floatingBoxes.push(new NodeForChildConnections(this.shape));
    this.floatingBoxes.push(new NodeForSelectingWholeGroup(this.shape))
    startWritinginInputForm(this.text.fullText);
  }

  drawCircles(){
    let s = this.shape
    let pos = [[s.x,s.y],[s.x,s.yMid],[s.x,s.yEnd],[s.xMid,s.y],[s.xMid,s.yEnd],[s.xEnd,s.y],[s.xEnd,s.yMid],[s.xEnd,s.yEnd]];
    for (let i = 0; i < 8; i++ ){
      this.circles[i] = new circleForExpanding(`${this.id}_circ${i}`,pos[i][0],pos[i][1],this.group)
      if (!creatingNewShape){
        this.circles[i].circle.addEventListener("mousedown",this.expand.bind(this));
      }
    }
  }
  
  unselect() {
    this.removeCircles();
    if (creatingNewShape == false){
      for (const x of this.floatingBoxes){
        x.remove()
      }
      this.floatingBoxes = []
      this.text.recalculate(this.shape);
    }
    if (!inputBox.disabled){
      this.text.fullText = endWritinginInputForm()
      this.text.recalculate(this.shape);
    }
    selected = null;
  }

  removeCircles(){
    for (let i = 0; i < 8; i++){
      this.circles[i].removeCircle();
    }
    this.circles = []
  }
  
  deleteSelect() {
    this.removeAllLinks();
    this.unselect();
    this.text.removeText();
    this.group.remove();
    area.onmousemove = null;
    area.onmouseup = null;
    creatingNewShape = false;
  }

  removeAllLinks(){
    if (this.parent){
      this.parent[0].children.delete(this);
      this.parent[1].line.remove();
    }
    for (const x of this.children.entries()) {
      x[0].tier = 0
      updateChildLinks(x[0]);
      x[1].line.remove();
    }
    
  }

  dragElement(e) {
    let dx = e.pageX - this.lastGrabbed[0]
    let dy = e.pageY - this.lastGrabbed[1]
    for (let i = 0; i<8; i++){
      this.circles[i].moveByAmount(dx,dy);
    }
    this.shape.moveByAmount(dx,dy);
    this.text.moveByAmount(dx,dy);
    if (creatingNewShape == false){
      for (const x of this.floatingBoxes){
        x.moveByAmount(dx,dy);
      }
    }
    this.moveParentLink();
    this.moveChildLinks();
    this.lastGrabbed = [e.pageX,e.pageY]
  }

  expand(e){
    e.stopPropagation();
    area.onmouseup = dropElement;
    switch(e.target){
      case this.circles[0].circle:
      area.onmousemove = e => {this.shape.expandUp.bind(this.shape)(e) ;this.shape.expandLeft.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[1].circle:
        area.onmousemove = e => {this.shape.expandLeft.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[2].circle:
        area.onmousemove = e => {this.shape.expandDown.bind(this.shape)(e);this.shape.expandLeft.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[3].circle:
        area.onmousemove = e => {this.shape.expandUp.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[4].circle:
        area.onmousemove = e => {this.shape.expandDown.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[5].circle:
        area.onmousemove = e => {this.shape.expandUp.bind(this.shape)(e);this.shape.expandRight.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[6].circle:
        area.onmousemove = e => {this.shape.expandRight.bind(this.shape)(e); this.resizedElement.bind(this)()};
        break;
      case this.circles[7].circle:
        area.onmousemove = e => {this.shape.expandDown.bind(this.shape)(e);this.shape.expandRight.bind(this.shape)(e); this.resizedElement.bind(this)()};
    }

  }

  resizedElement(){
    this.shape.recalculate();
    this.recalculateCircles();
    this.text.recalculate(this.shape);
    if (creatingNewShape == false){
      for (const x of this.floatingBoxes){
        x.resizeElement(this.shape);
      }
      this.moveParentLink();
      this.moveChildLinks();
    }
  }

  recalculateCircles(){
    let s = this.shape
    let pos = [[s.x,s.y],[s.x,s.yMid],[s.x,s.yEnd],[s.xMid,s.y],[s.xMid,s.yEnd],[s.xEnd,s.y],[s.xEnd,s.yMid],[s.xEnd,s.yEnd]]
    for (let i = 0; i < 8; i++ ){
      this.circles[i].moveTo(pos[i][0],pos[i][1])
    }
  }

  moveParentLink(){
    if (this.parent){
      this.parent[1].line.setAttribute('x2',this.shape.xMid);
      this.parent[1].line.setAttribute('y2',this.shape.yMid)
    }
  }

  moveChildLinks(){
    for (const x of this.children.values()) {
      x.line.setAttribute('x1',this.shape.xMid);
      x.line.setAttribute('y1',this.shape.yMid);
    }
  }
}








class Link {
  constructor(line,parent,child){
    this.line = line;
    this.parent = parent;
    this.child = child;
    this.lastGrabbed = []
    this.circles = [];
  }

  select(){
    this.drawCircles();
    this.line.setAttribute('stroke','purple')
    
  }
    
  unselect(){
    this.removeCircles();
    this.line.setAttribute('stroke',colourArray[this.parent.tier])
    selected = null;
  }
    
  deleteSelect(e){
    this.removeCircles();
    this.parent.children.delete(this.child)
    this.line.remove();
    this.child.tier = 0;
    updateChildLinks(this.child);
    this.child.parent = null;
    selected = null;
  }

  drawCircles(){
    this.circles[0] = new circleForExpanding(null,this.parent.shape.xMid,this.parent.shape.yMid,area);
    this.circles[1] = new circleForExpanding(null,this.child.shape.xMid,this.child.shape.yMid,area)
  }
  
  removeCircles(){
    this.circles[0].removeCircle();
    this.circles[1].removeCircle();
    this.circles = []
  }

  dragElement(e){
    let dx = e.pageX - this.lastGrabbed[0]
    let dy = e.pageY - this.lastGrabbed[1]
    this.circles[0].moveByAmount(dx,dy);
    this.circles[1].moveByAmount(dx,dy);
    this.lastGrabbed = [e.pageX,e.pageY]
  }
  
}






class circleForExpanding{
  constructor(id,cx,cy,insertInto){
    this.circle = createNewCircle(null,id,5,cx,cy,'white','black');
    this.cx = cx
    this.cy = cy
    insertInto.appendChild(this.circle);
  }

  moveByAmount(dx,dy){
    this.cx += dx
    this.cy += dy
    this.circle.setAttribute('cx',this.cx);
    this.circle.setAttribute('cy',this.cy);
  }

  moveTo(x,y){
    this.cx = x
    this.cy = y
    this.circle.setAttribute('cx',this.cx);
    this.circle.setAttribute('cy',this.cy);
  }

  removeCircle(){
    this.circle.remove();
  }
}





class floatingRect{
  constructor(shape,icon,className,id,fill,stroke,rx){
    this.recalculate(shape);

    this.rect = createNewRectangle(className,id,this.x,this.y,this.width,this.height,fill,stroke,rx)
    area.appendChild(this.rect)
    this.rect.addEventListener('mousedown',this.onClickFunc);

    if (icon){
      this.icon = icon
      this.setAllAttributes(this.icon)
      area.appendChild(this.icon)
    }
    
  }

  moveTo(x,y){
    this.x = x
    this.y = y
    this.setAllAttributes(this.rect);
    if (this.icon){
      this.setAllAttributes(this.icon);
    }
  }

  moveByAmount(dx,dy){
    this.x += dx;
    this.y += dy;
    this.setAllAttributes(this.rect);
    if (this.icon){
      this.setAllAttributes(this.icon);
    }
  }

  recalculate(shape){
    this.x = this.xFunc(shape);
    this.y = this.yFunc(shape);
    this.width = this.widthFunc(shape);
    this.height = this.heightFunc(shape);
  }

  resizeElement(shape){
    this.recalculate(shape)
    this.setAllAttributes(this.rect);
    if (this.icon){
      this.setAllAttributes(this.icon);
    }
  }

  setAllAttributes(element){
    element.setAttribute('x',this.x);
    element.setAttribute('y',this.y);
    element.setAttribute('width',this.width);
    element.setAttribute('height',this.height);
  }

  remove(){
    this.rect.remove();
    if (this.icon){
      this.icon.remove();
    }
  }
}



class NodeForParentConnections extends floatingRect{
  constructor(shape){
    super(shape,null,null,null,'red','black','15');
  }

  xFunc(shape){
    return shape.x + (shape.width/4);
  }

  yFunc(shape){
    return shape.y - 25;
  }

  widthFunc(shape){
    return shape.width/2;
  }

  heightFunc(shape){
    return 15;
  }

  onClickFunc(e){
    if (drawingLink){
      selected.potentialLink.line.remove();
      selected.potentialLink = null;
    }
    drawingLink = true;
    e.stopPropagation();
    newLine = createNewLine("temporary",`${selected.id}_line`,selected.shape.xMid,selected.shape.y-15,adjustX(e.pageX),adjustY(e.pageY),'red',5);
    area.appendChild(newLine);
    selected.potentialLink = new PotentialLink(true,newLine);
  
    onmousemove = selected.potentialLink.followMouseWithLine.bind(selected.potentialLink);
  }
} 





class NodeForChildConnections extends floatingRect{
  constructor(shape){
    super(shape,null,null,null,'blue','black','15');
  }

  xFunc(shape){
    return shape.x + (shape.width/4);
  }

  yFunc(shape){
    return shape.y + shape.height + 10;
  }

  widthFunc(shape){
    return shape.width/2;
  }

  heightFunc(shape){
    return 15;
  }



  onClickFunc(e){
    if (drawingLink){
      selected.potentialLink.line.remove();
      selected.potentialLink = null;
    }
    drawingLink = true;
    e.stopPropagation();
    newLine = createNewLine("temporary",`${selected.id}_line`,selected.shape.xMid,selected.shape.yEnd+15,adjustX(e.pageX),adjustY(e.pageY),'blue',5);
    area.appendChild(newLine);
    selected.potentialLink = new PotentialLink(false,newLine);
  
    onmousemove = selected.potentialLink.followMouseWithLine.bind(selected.potentialLink);
  }
} 




class NodeForSelectingWholeGroup extends floatingRect{
  constructor(shape){
    super(shape,null,null,null,'white','black','0');
  }

  xFunc(shape){
    return shape.x + shape.width + 10
  }

  yFunc(shape){
    return shape.y + (shape.height / 10)
  }

  widthFunc(shape){
    return shape.height / 6
  }

  heightFunc(shape){
    return shape.height / 6;
  }

  onClickFunc(e){
    e.stopPropagation();
    return;
    selected = new Tree(group)
    selected.select();
    startMovement(e);
  }
}





class elementText{
  constructor(shape,fullText,displayText){
    this.fullText = fullText;
    this.displayText = displayText;
    this.x = shape.x
    this.y = shape.y
  }

  moveByAmount(dx,dy){
    this.x += dx
    this.y += dy
    this.displayText.setAttribute('y',this.y);
    for (const child of this.displayText.children) {
      child.setAttribute('x',this.x);
    }
  }

  moveTo(x,y){
    this.x = x
    this.y = y
    this.displayText.setAttribute('x',this.x);
    this.displayText.setAttribute('y',this.y);
  }
  
  recalculate(shape){
    this.moveTo(shape.x,shape.y)
    this.fitToBox(shape)
  }

  fitToBox(shape){
    let numLines = shape.height / 12
    const lines = []
    let lineLength = shape.width / 8
    let words = this.fullText.split(" ");
  
    this.displayText.replaceChildren();
  
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
        newText = "<tspan dy = '10' dx = '0' x='"+this.x+"'>...</tspan>";
        this.displayText.insertAdjacentHTML('beforeend', newText);
  
        break;
      }
      newText = "<tspan dy = '10' dx = '0' x='"+this.x+"'>"+lines[i]+"</tspan>";
      this.displayText.insertAdjacentHTML('beforeend', newText);
    }
  
  }
  
  removeText(){
    this.displayText.remove();
  }
}

class Rectangle{
  constructor(rect){
    this.rect = rect;
    this.recalculate();
  }

  recalculate(){
    this.x = +this.rect.getAttribute('x');
    this.y = +this.rect.getAttribute('y');
    this.id = this.rect.getAttribute('id');
    this.width = +this.rect.getAttribute('width');
    this.height = +this.rect.getAttribute('height');
    this.yMid = this.y+(this.height/2);
    this.yEnd = this.y+this.height;
    this.xMid = this.x+(this.width/2);
    this.xEnd = this.x+this.width;
  }

  moveByAmount(dx,dy){
    this.x += dx
    this.y += dy
    this.rect.setAttribute('x',this.x);
    this.rect.setAttribute('y',this.y);
    this.recalculate();
    this.lastGrabbed = []
  }

  expandLeft(e){
    let newX = adjustX(e.pageX);
    let newWidth = this.width + (this.x - newX);
    
    if (newWidth > minX){
      this.rect.setAttribute('x',newX);
      this.rect.setAttribute('width',newWidth);
    }
  }
  
  expandRight(e){
    let newWidth = adjustX(e.pageX) - this.x;
    
    if (newWidth > minX){
      this.rect.setAttribute('width',newWidth);
    }
  }
  
  expandUp(e){
    let newY = adjustY(e.pageY);
    let newHeight = this.height + (this.y - newY); 
  
    if (newHeight > minY){
      this.rect.setAttribute('y',newY);
      this.rect.setAttribute('height',newHeight);
    }
  }
  
  expandDown(e){
    let newHeight = adjustY(e.pageY) - this.y;
    
    if (newHeight >minY){
      this.rect.setAttribute('height',newHeight);
    }
  }
}


class PotentialLink{
  constructor(parent,line){
    this.connectingToParent = parent;
    this.line = line;
  }

  followMouseWithLine(e){
    this.line.setAttribute('x2',adjustX(e.pageX))
    this.line.setAttribute('y2',adjustY(e.pageY))
  }
}



let creatingNewShape = false;
let drawingLink = false;
let elementsCreated = 0;

let selected = null;

let groupObjects = new Map();

let offsetX = area.getBoundingClientRect().left + window.scrollX
let offsetY = area.getBoundingClientRect().top + window.scrollY

let minX = 125;
let minY = 75;


//The user clicks on the svg area but no element
function clickOnSVG(e){
  calculateOffsets();
  if (drawingLink){
    endDrawingLink(); 
  
  }else if (creatingNewShape){
    selected.group.addEventListener("mousedown", clickOnElement, false);
    selected.group.addEventListener("dblclick", dbClickOnElement, false);
    selected.unselect();
    area.onmousemove = null;
    creatingNewShape = false;
  
  }else if (selected != null){
    selected.unselect();

  }else{
    creatingNewShape = true;
    selected = createNewElement(e);
    groupObjects.set(selected.group,selected)
    selected.drawCircles();
    area.onmousemove = (event => selected.drawBox.bind(selected)(event,adjustX(e.pageX),adjustY(e.pageY)));
    elementsCreated++
  }
}

function endDrawingLink(){
  drawingLink = false;
  selected.potentialLink.line.remove();
  onmousemove = null
}

//The user clicks on a shape
function clickOnElement(e) {
  calculateOffsets();
  if (creatingNewShape){
    return;
  }
  e.stopPropagation();
  if (drawingLink){
    clickedOnObject = groupObjects.get(e.currentTarget)
    if (clickedOnObject != selected.group){
      connectBox(clickedOnObject);
    }
    return;
  }
  if (selected == null){
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }else if (groupObjects.get(e.currentTarget) != selected){
    selected.unselect();
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }
  startMovement(e);
}

function startMovement(e){
  selected.lastGrabbed = [e.pageX,e.pageY];
  area.onmousemove = dragElement;
  area.onmouseup = (e => {dragElement(e); dropElement(e)});
}

function dragElement(e){
  selected.dragElement(e)
}

function dropElement() {
  area.onmouseup = null;
  area.onmousemove = null;
}

function clickOnConnection(e){
  calculateOffsets();
  if (drawingLink){
    endDrawingLink(); 
    return;
  }else if (creatingNewShape){
    return;
  }
  e.stopPropagation();
  if (selected == null){
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }else if (groupObjects.get(e.currentTarget) != selected){
    selected.unselect();
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }
}

function deleteSelect(e){
  if (drawingLink == true){
    endDrawingLink();
    return;
  }
  if (e.keyCode == 8 && selected != null){
    selected.deleteSelect();
    selected = null;
  }
}

function dbClickOnElement(e){
  calculateOffsets();
  group = groupObjects.get(e.currentTarget);
  selected = new Tree(group)
  selected.select();
  startMovement(e);
}

function createNewElement(e){
  newGroup = document.createElementNS("http://www.w3.org/2000/svg","g");
  newGroup.setAttribute('id',`g${elementsCreated}`)
  area.appendChild(newGroup);

  newRect = createNewRectangle(null,`rect${elementsCreated}`,adjustX(e.pageX)-(minX/2),adjustY(e.pageY)-(minY/2),minX,minY,'white','black',0)
  newGroup.appendChild(newRect);

  fullText = ""
  displayText = document.createElementNS("http://www.w3.org/2000/svg","text")
  displayText.setAttribute('id',`text_rect${elementsCreated}`)
  newGroup.appendChild(displayText);

  return new Group(`rect${elementsCreated}`,newGroup, new Rectangle(newRect),fullText,displayText);
}


function createNewCircle(className,id,r,cx,cy,fill,stroke){
  newCirc = document.createElementNS("http://www.w3.org/2000/svg","circle")
  newCirc.setAttribute('class',className)
  newCirc.setAttribute('id',id)
  newCirc.setAttribute('r',r)
  newCirc.setAttribute('cx',cx)
  newCirc.setAttribute('cy',cy)
  newCirc.setAttribute('fill',fill)
  newCirc.setAttribute('stroke',stroke)

  return newCirc;
}

function createNewLine(className,id,x1,y1,x2,y2,stroke,width){
  newLine = document.createElementNS("http://www.w3.org/2000/svg","line")
  newLine.setAttribute('class',className)
  newLine.setAttribute('id',id)
  newLine.setAttribute('x1',x1)
  newLine.setAttribute('y1',y1)
  newLine.setAttribute('x2',x2);
  newLine.setAttribute('y2',y2);
  newLine.setAttribute('stroke',stroke)
  newLine.setAttribute('stroke-width',width)

  return newLine;
}

function createNewRectangle(className,id,x,y,width,height,fill,stroke,rx){
  newRect = document.createElementNS("http://www.w3.org/2000/svg","rect");
  newRect.setAttribute('class',className);
  newRect.setAttribute('id',id);
  newRect.setAttribute('x',x);
  newRect.setAttribute('y',y);
  newRect.setAttribute('width',width);
  newRect.setAttribute('height',height);
  newRect.setAttribute('fill',fill);
  newRect.setAttribute('stroke',stroke);
  newRect.setAttribute('rx',rx);

  return newRect;
}

function calculateOffsets(){
  offsetX = area.getBoundingClientRect().left + window.scrollX
  offsetY = area.getBoundingClientRect().top + window.scrollY
}

function adjustX(x){
  return x - offsetX
}

function adjustY(y){
  return y - offsetY
}



function connectBox(dest){
  drawingLink = false;
  onmousemove = null

  selected.potentialLink.line.remove();

  if (selected.potentialLink.connectingToParent){
    establishLink(dest,selected);
  }else{
    establishLink(selected,dest);
  }  

function establishLink(parentElement,childElement){
  ancestor = isAncestor(parentElement,childElement)
  if (ancestor){
    ancestor.parent[1].line.remove();
    ancestor.parent[0].children.delete(ancestor);
    ancestor.tier = 0
    ancestor.parent = null;
    updateChildLinks(ancestor)
  }

  if (childElement.parent){
    if (childElement.parent[0]==parentElement){
      return;
    }
    childElement.parent[1].line.remove();
    childElement.parent[0].children.delete(childElement);
    childElement.parent = null;
  }

  childElement.tier = parentElement.tier + 1
  newLine = createNewLine("permanent",`line_${parentElement.id}_${childElement.id}`,parentElement.shape.xMid,parentElement.shape.yMid,childElement.shape.xMid,childElement.shape.yMid,colourArray[parentElement.tier],12 * (1/(parentElement.tier+1)));
  area.prepend(newLine);
  newLine.addEventListener("mousedown",clickOnConnection);
  let lineElem = new Link(newLine,parentElement,childElement);
  groupObjects.set(newLine,lineElem)
  parentElement.children.set(childElement, lineElem);
  childElement.parent = [parentElement,lineElem]
  updateChildLinks(childElement)
  
}

function isAncestor(parentElement,childElement){
  while (parentElement.parent){
    if (parentElement.parent[0] == childElement){
      return parentElement;
    }
    parentElement = parentElement.parent[0]
  }
  return null;
}

}

function updateChildLinks(node){
  for (const x of node.children.keys()) {
    x.tier = node.tier + 1
    x.parent[1].line.setAttribute('stroke',colourArray[node.tier]);
    x.parent[1].line.setAttribute('stroke-width',12 * (1/(node.tier+1)));
    updateChildLinks(x);
  }
}

function startWritinginInputForm(text){
  inputBox.value = text
  inputBox.disabled = false;
}

function endWritinginInputForm(){
  let value = inputBox.value
  inputBox.disabled = true;
  inputBox.value = "You must select a box first"
  return value;
  
}




