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
  if (selected && selected instanceof Group && inputBox.disabled == false){
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
    this.descendants.shift(); // removes the root from the array
  }

  traverseTree(node){
    this.descendants.push(node);
    for (const x of node.children.entries()) {
      this.descendants.push(x[1])
      this.traverseTree(x[0])
    }
  }

  select(){
    this.root.rootSelect();
    this.root.nodeForGrouping.setColour("#BF40BF");
    for (const x of this.descendants){
      x.groupSelect();
    }
    endWritinginInputForm();
  }

  unselect(){
    this.root.unselect();
    for (const x of this.descendants){
      x.unselect();
    }
  }

  deleteSelect(){
    this.root.deleteSelect();
    for (const x of this.descendants){
      x.deleteSelect();
    }
  }

  dragElement(e){
    this.root.lastGrabbed[0] = this.lastGrabbed[0];
    this.root.lastGrabbed[1] = this.lastGrabbed[1];
    this.root.dragElement(e); 
    for (const x of this.descendants){
      x.lastGrabbed[0] = this.lastGrabbed[0];
      x.lastGrabbed[1] = this.lastGrabbed[1];
      x.dragElement(e);
    }
    this.lastGrabbed = [e.pageX,e.pageY]
  }

  checkClicked(currentTarget){
    let targetObject = groupObjects.get(currentTarget);
    let ans = !this.descendants.includes(targetObject) && targetObject != this.root;
    return ans
  }

  startMovement(){
    this.root.startMovement();
    for (const x of this.descendants){
      x.startMovement();
    }
  }

  endMovement(){
    this.root.endMovement();
    for (const x of this.descendants){
      x.endMovement();
    }
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

    this.nodeForMoving = null;
    this.nodeForGrouping = null;
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
    this.rootSelect();
    this.floatingBoxes.push(new NodeForParentConnections(this.shape,this.group));
    this.floatingBoxes.push(new NodeForChildConnections(this.shape,this.group));
  }

  rootSelect(){
    this.groupSelect();
    this.nodeForGrouping = new NodeForSelectingWholeGroup(this.shape,this.group);
    this.floatingBoxes.push(this.nodeForGrouping)
  }

  groupSelect(){
   this.drawCircles();
  }

  changeText(){
    this.text.displayText.setAttribute("filter","none")
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
    if (e.button != 0) return;

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
  
  checkClicked(currentTarget){
    return currentTarget != this.group;
  }

  startMovement(){
    this.shape.setColour("grey")
    this.text.displayText.setAttribute("filter","url(#blur)")
    this.nodeForMoving = new NodeForMoving(this.shape,this.group)
    this.floatingBoxes.push(this.nodeForMoving); 
  }

  endMovement(){
    this.shape.setColour("white")
    this.text.displayText.setAttribute("filter","none")
    if (this.nodeForMoving){
      this.nodeForMoving.remove();
      this.nodeForMoving = null;
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
    this.directionArrow = null;
    this.interceptPosParent = []
    this.interceptPosChild = []
  }

  select(){
    this.drawCircles();
    this.line.setAttribute('stroke','purple')
    this.directionArrow = new NodeFoReversingLink(this.parent, this.child, this.interceptPosParent, this.interceptPosChild);

  }

  groupSelect(){
    this.line.setAttribute('stroke','purple')
  }
    
  unselect(){
    this.removeCircles();
    this.line.setAttribute('stroke',colourArray[this.parent.tier])
    this.directionArrow.remove();
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
    this.interceptPosParent = this.calculateIntercept(this.parent,this.child)
    this.circles[0] = new circleForExpanding(null,this.interceptPosParent[0],this.interceptPosParent[1],area);

    this.interceptPosChild = this.calculateIntercept(this.child,this.parent)
    this.circles[1] = new circleForExpanding(null,this.interceptPosChild[0],this.interceptPosChild[1],area)
  }

  calculateIntercept(boxCut,otherEnd){
    let m = (otherEnd.shape.yMid - boxCut.shape.yMid) / (otherEnd.shape.xMid - boxCut.shape.xMid)
    let c = boxCut.shape.yMid - (m * boxCut.shape.xMid)

    let x, y
    //Top Wall
    y = boxCut.shape.y
    x = this.calcX(y,m,c)
    if (x > boxCut.shape.x && x < boxCut.shape.xEnd && boxCut.shape.yMid > otherEnd.shape.yMid) return[x,y]

    //Bottom Wall
    y = boxCut.shape.yEnd
    x = this.calcX(y,m,c)
    if (x > boxCut.shape.x && x < boxCut.shape.xEnd && boxCut.shape.yMid < otherEnd.shape.yMid) return[x,y]

    //Left Wall
    x = boxCut.shape.x
    y = this.calcY(x,m,c)
    if (y > boxCut.shape.y && y < boxCut.shape.yEnd && boxCut.shape.xMid > otherEnd.shape.xMid) return[x,y]

    //Right Wall
    x = boxCut.shape.xEnd
    y = this.calcY(x,m,c)
    if (y > boxCut.shape.y && y < boxCut.shape.yEnd && boxCut.shape.xMid < otherEnd.shape.xMid) return[x,y]
  }

  calcX(y, m ,c){
    return (y-c) / m
  }

  calcY(x,m,c){
    return m * x + c
  }
  
  removeCircles(){
    if (this.circles.length == 0) return;

    this.circles[0].removeCircle();
    this.circles[1].removeCircle();
    this.circles = []
  }

  dragElement(e){

  }

  checkClicked(currentTarget){
    return currentTarget != this.line;
  }

  startMovement(){
  }

  endMovement(){
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
  constructor(shape,icon,iconWidth,className,id,fill,stroke,rx,insertInto){
    this.recalculate(shape);
    this.adjustment = 2;

    this.rect = createNewRectangle(className,id,this.x,this.y,this.width,this.height,fill,stroke,rx)
    insertInto.appendChild(this.rect)
    this.rect.addEventListener('mousedown',this.onClickFunc);

    if (icon){
      this.icon = document.createElementNS("http://www.w3.org/2000/svg","svg")
      this.setAllAttributes(this.icon,this.adjustment)
      this.icon.setAttribute('viewBox',`0 0 ${iconWidth} ${iconWidth}`)
      this.icon.setAttribute('preserveAspectRatio',"false")
      insertInto.appendChild(this.icon)
      this.icon.insertAdjacentHTML("beforeend",icon)
      this.icon.addEventListener('mousedown',this.onClickFunc);
    }
    
  }

  moveTo(x,y){
    this.x = x
    this.y = y
    this.setAllAttributes(this.rect,0);
    if (this.icon){
      this.setAllAttributes(this.icon,this.adjustment);
    }
  }

  moveByAmount(dx,dy){
    this.x += dx;
    this.y += dy;
    this.setAllAttributes(this.rect,0);
    if (this.icon){
      this.setAllAttributes(this.icon,this.adjustment);
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
    this.setAllAttributes(this.rect,0);
    if (this.icon){
      this.setAllAttributes(this.icon,this.adjustment);
    }
  }

  setAllAttributes(element,adj){
    element.setAttribute('x',this.x + adj);
    element.setAttribute('y',this.y + adj);
    element.setAttribute('width',this.width - (2*adj));
    element.setAttribute('height',this.height - (2*adj));
  }

  remove(){
    this.rect.remove();
    if (this.icon){
      this.icon.remove();
    }
  }

  setColour(colour){
    this.rect.setAttribute("fill",colour);
  }
}



class NodeForParentConnections extends floatingRect{
  constructor(shape,insertInto){
    let icon = ""
    let iconWidth = 0
    super(shape,icon,iconWidth,null,null,'red','black','15',insertInto);
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
    if (e.button != 0) return;

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
  constructor(shape,insertInto){
    let icon = ""
    let iconWidth = 0
    super(shape,icon,iconWidth,null,null,'blue','black','15',insertInto);
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
    if (e.button != 0) return;
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
  constructor(shape,insertInto){
    let icon = '<use href="#graph" x = "0" y ="0"/>'
    let iconWidth = 488
    super(shape,icon,iconWidth,null,null,'white','black','0',insertInto);
  }

  xFunc(shape){
    return shape.x + shape.width + 10
  }

  yFunc(shape){
    return shape.y + 5
  }

  widthFunc(shape){
    return Math.min(shape.height / 8, shape.width/8);
  }

  heightFunc(shape){
    return Math.min(shape.height / 8, shape.width/8);
  }

  onClickFunc(e){
    e.stopPropagation();
    if (e.button != 0) return;

    if (selected instanceof Group){
      if (drawingLink) endDrawingLink();
      selected = new Tree(selected)
      selected.select();
    }else{
      let group = selected.root;
      selected.unselect();
      group.select();
      selected = group;
    }
  }
}



class NodeForMoving extends floatingRect{
  constructor(shape,insertInto){
    let icon =  '<use href="#fourArrows" x = "0" y ="0"/>'
    let iconWidth = 23.5
    super(shape,icon,iconWidth,null,null,'none','none','0',insertInto);
  }

  xFunc(shape){
    return shape.x + shape.width / 2 - (this.widthFunc(shape) / 2);
  }

  yFunc(shape){
    return shape.y + shape.height / 2 - (this.heightFunc(shape) / 2);
  }

  widthFunc(shape){
    return Math.min(shape.height / 4, shape.width/4);
  }

  heightFunc(shape){
    return Math.min(shape.height / 4, shape.width/4);
  }

  onClickFunc(e){

  }
}

class NodeFoReversingLink{
  constructor(parentElement,childElement,interceptOne,interceptTwo){
    this.interceptOne = interceptOne
    this.interceptTwo = interceptTwo
    this.parentElement = parentElement
    this.childElement = childElement
    this.recalculate();

    let x1 = 20
    let y1 = 0

    let heightOfSegment = Math.sin(Math.PI / 6) * 20
    let y2 = heightOfSegment + 20
    let y3 = heightOfSegment + 20

    let widthOfTriangle = 2 * ((20 ** 2 - heightOfSegment ** 2) ** 0.5)

    let changeInX = (widthOfTriangle ** 2 - y2 ** 2) ** 0.5

    let x2 = x1 - changeInX
    let x3 = x1 + changeInX
    

    this.triangle = `<polygon points = "${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="purple" stroke ="black">`
    this.svg = `<svg viewBox = "0 0 20 20" height ="${this.height}" width ="${this.width}" x ="${this.x}" y="${this.y}></svg>"`
    area.insertAdjacentHTML("beforeend",this.svg);



    this.svg = document.createElementNS("http://www.w3.org/2000/svg","svg")
    this.svg.setAttribute("viewBox",`0 0 40 40`)
    this.svg.setAttribute("height",this.height)
    this.svg.setAttribute("width",this.width)
    this.svg.setAttribute("x",this.x)
    this.svg.setAttribute("y",this.y)


  
    area.appendChild(this.svg)

    this.svg.insertAdjacentHTML("beforeend",this.triangle)
    this.triangle = this.svg.firstChild;

    this.rotateElement();
    this.svg.addEventListener('mousedown',this.onClickFunc);
  }

  xFunc(){
    return (this.interceptOne[0] + this.interceptTwo[0]) / 2 - (this.widthFunc() /2)
  }

  yFunc(){
    return (this.interceptOne[1] + this.interceptTwo[1]) / 2 - (this.heightFunc() /2)
  }

  widthFunc(){
    return (1/(this.parentElement.tier+1)) * 40 
  }

  heightFunc(){
    return (1/(this.parentElement.tier+1)) * 40 
    }

  onClickFunc(e){
    establishLink(this.childElement,this.parentElement)

  }

  recalculate(){
    this.x = this.xFunc();
    this.y = this.yFunc();
    this.width = this.widthFunc();
    this.height = this.heightFunc();
  }

  remove(){
    this.svg.remove();
  }

  rotateElement(){
    let x = 20
    let y = 20

    let dy = this.childElement.shape.yMid - this.parentElement.shape.yMid
    let dx = this.childElement.shape.xMid - this.parentElement.shape.xMid

    let theta = Math.atan(dy / dx) * (180 / Math.PI)
    theta += 90
    if (this.childElement.shape.xMid < this.parentElement.shape.xMid){
    theta += 180
    }
    console.log(theta)


    this.triangle.setAttribute("transform",`rotate(${theta},${x},${y})`)
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
    if (this.fullText == "") return;
     
    this.displayText.innerHTML = "";

    let textToDisplay = this.fullText.replaceAll("\r\n","\n")
    textToDisplay = textToDisplay.replaceAll("\r","\n")
    textToDisplay = textToDisplay.replaceAll("\n"," \n ")
    textToDisplay = textToDisplay.split(" ")
    let shapeSize = shape.rect.getBBox()

    let linesOfText = this.generateLines(shape.width - 10, textToDisplay);
    this.insertLinesOfText(shape,linesOfText,shapeSize.height - 10,shapeSize.width - 10);
  }

  generateLines(boxWidth,textToDisplay){
    let linesOfText = []
    let wordLength;
    let widthUsed = 0; let numberOfLines = 0;
    for (let i = 0; i < textToDisplay.length; i++){
      wordLength = this.findTextWidth(textToDisplay[i]+"m"); 
      if (widthUsed + wordLength > boxWidth || textToDisplay[i] == "\n"){
        if (wordLength > boxWidth){
          linesOfText[numberOfLines] = " ..."
          break; 
        }

        numberOfLines++;
        linesOfText[numberOfLines] = textToDisplay[i]
        widthUsed = wordLength;
      }else{
        if (numberOfLines == 0 && widthUsed == 0){
          linesOfText[numberOfLines] =  textToDisplay[i]
        }else{
          linesOfText[numberOfLines] += " " + textToDisplay[i]
        }
        widthUsed += wordLength;

      }
    }
    return linesOfText;
  }

  findTextWidth(text){
    let testText = createNewTspan(text);
    this.displayText.appendChild(testText)
    let textSize = testText.getBBox();
    testText.remove()
    return textSize.width
  }

  insertLinesOfText(shape,linesOfText,height,width){
    let lineHeight = this.findLineHeight() + 2;
    let possibleNumberOfLines = Math.floor(height / lineHeight);
    if (possibleNumberOfLines > linesOfText.length){
      let startY = shape.yMid - (linesOfText.length / 2) * lineHeight;
      this.moveTo(shape.xMid,startY)
      for (let i = 0; i < linesOfText.length; i++){
        this.displayText.appendChild(createNewTspan(linesOfText[i],null,null,shape.xMid,null,0,lineHeight))
      }
    }else{
      let startY = shape.y + 5
      this.moveTo(shape.xMid,startY)
      this.alterLastLine(linesOfText,possibleNumberOfLines-1,width)
      for (let i = 0; i < possibleNumberOfLines; i++){
        this.displayText.appendChild(createNewTspan(linesOfText[i],null,null,shape.xMid,null,0,lineHeight))
      }
    }


  }
  
  findLineHeight(){
    let testText = createNewTspan("|");
    this.displayText.appendChild(testText)
    let textSize = testText.getBBox();
    testText.remove()
    return textSize.height;
  }

  alterLastLine(linesOfText,lastLineToDisplay, width){
    let lastLine = linesOfText[lastLineToDisplay]
    let dotsWidth = this.findTextWidth(" ...")
    if (this.findTextWidth(lastLine) + dotsWidth < width){
      linesOfText[lastLineToDisplay] += " ..."
    }else{
      lastLine = lastLine.slice(lastLine.length - 5);
      lastLine += " ..."
      linesOfText[lastLineToDisplay] = lastLine;
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

  setColour(colour){
    this.rect.setAttribute("fill",colour);
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

let timeOutId = 0

//The user clicks on the svg area but no element
function clickOnSVG(e){
  if (e.button != 0) return;

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
  if (e.button != 0) return ;

  calculateOffsets();
  if (creatingNewShape){
    return;
  }
  e.stopPropagation();
  if (drawingLink){
    clickedOnObject = groupObjects.get(e.currentTarget)
    if (clickedOnObject == selected) return;

    if(clickedOnObject instanceof Link){
      endDrawingLink(); 
      return;
    }
    connectBox(clickedOnObject);
    return;
  }
  if (selected == null){
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }else if (selected.checkClicked(e.currentTarget)){
    selected.unselect();
    selected = groupObjects.get(e.currentTarget);
    selected.select();
  }
  startMovement(e);
}

function startMovement(e){
  selected.lastGrabbed = [e.pageX,e.pageY];
  timeOutId = setTimeout(selected.startMovement.bind(selected),200);
  area.onmousemove = dragElement;
  area.onmouseup = (e => {dragElement(e); dropElement(e)});
}

function dragElement(e){
  selected.dragElement(e)
}

function dropElement() {
  clearTimeout(timeOutId);
  selected.endMovement();
  area.onmouseup = null;
  area.onmousemove = null;
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
  if (e.button != 0) return;

  if (selected instanceof Group){
    selected.changeText();
    inputBox.focus();
  }
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
  displayText.setAttribute('font-size',"1em");
  displayText.setAttribute('text-anchor',"middle")
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

function createNewTspan(text,className,id,x,y,dx,dy){
  newTspan = document.createElementNS("http://www.w3.org/2000/svg","tspan");
  newTspan.textContent = text
  newTspan.setAttribute('class',className);
  newTspan.setAttribute('id',id);
  newTspan.setAttribute('x',x);
  newTspan.setAttribute('y',y);
  newTspan.setAttribute('dx',dx);
  newTspan.setAttribute('dy',dy);


  return newTspan;
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
  newLine.addEventListener("mousedown",clickOnElement);
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
  inputBox.value = "Double click on a box to edit its text"
  return value;
  
}



