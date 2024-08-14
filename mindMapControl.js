area = document.getElementById("mySvg");
area.addEventListener("mousedown", newElement);
document.addEventListener("keydown", deleteSelect);

let growing = false;
let count = 0;
let selected = null;
let posGrabbedX, posGrabbedY
const circs = [] 
let start;

function newElement(event){
  if (selected != null && growing == false){
    unselect();
  }else if (!growing){
    let newElement = createNewElement(event);
    start = [event.clientX, event.clientY];
    area.insertAdjacentHTML('beforeend', newElement);
    selected = document.getElementById("rect"+count)
    drawCircles();
    area.onmousemove = drawBox;
    count++
    growing = true;
  }else{
    selected.addEventListener("mousedown", clickOnElement, false);
    unselect();
    area.onmousemove = null;
    growing = false;
  }
}

function select(e){
  selected = e.target;
  drawCircles();
}

function unselect(){
  removeCircles();
  selected = null;
}

function deleteSelect(e){
  console.log(e.keyCode);
  if (e.keyCode == 8 && selected != null){
    removeCircles();
    removeText();
    selected.remove();
    selected = null;
  }
}

function createNewElement(e){
  return "<rect draggable='true' id='rect"+count+"' width = '0' height = '0' x='"+e.pageX+"' y='"+e.pageY+"' fill='white' stroke='black'/><text id='text_rect"+count+"' x='"+e.pageX+"' y = '"+e.pageY+"'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe obcaecati, omnis est recusandae hic possimus consequatur labore in. Esse dicta sunt, molestiae cum velit ex</text>";
}


function clickOnElement(e) {
    if (growing == true){
      return 0;
    }
    e.stopPropagation();
    if (selected == null){
      select(e);
    }else if (e.target != selected){
      unselect();
      select(e);
    }
    startMovement(e);
}

function startMovement(e){
  posGrabbedX = e.clientX - selected.getAttribute('x');   
  posGrabbedY = e.clientY - selected.getAttribute('y');   
  
  area.onmousemove = dragElement;
  area.onmouseup = dropElement;
}

function dragElement(e) {
  e.preventDefault();
  width = selected.getAttribute('width');
  height = selected.getAttribute('height');
  selected.setAttribute("x", e.clientX - posGrabbedX);
  selected.setAttribute("y", e.clientY - posGrabbedY);

  changeText();
  changeCircles();
}

function dropElement() {
  area.onmouseup = null;
  area.onmousemove = null;
  
}

function changeText(){
  x = +selected.getAttribute('x');
  y = +selected.getAttribute('y');
  id = selected.getAttribute('id');
  t = document.getElementById("text_"+id)
  t.setAttribute('x',x)
  t.setAttribute('y',y)
}

function removeText(){
  id = selected.getAttribute('id');
  t = document.getElementById("text_"+id)
  t.remove();
}

function drawBox(event){
  let width, height;
  let x , y;
  if (start[0] < event.pageX){
    width = event.pageX - start[0];
    x = start[0]
  }else{
    width = start[0] - event.pageX;
    x = event.pageX;
  }

  if (start[1] < event.pageY){
    height = event.pageY - start[1]
    y = start[1]
  }else{
    height = start[1] - event.pageY
    y = event.pageY
  }
  selected.setAttribute("x", x);
  selected.setAttribute("y", y);
  selected.setAttribute("width", width);
  selected.setAttribute("height", height);
  changeCircles()
  changeText();
}

function drawCircles(){
  x = +selected.getAttribute('x');
  y = +selected.getAttribute('y');
  width = +selected.getAttribute('width');
  height = +selected.getAttribute('height');
  id = selected.getAttribute('id');
  
  yMid = y+(height/2)
  yEnd = y+height
  
  xMid = x+(width/2)
  xEnd = x+width

  let pos = [[x,y],[x,yMid],[x,yEnd],[xMid,y],[xMid,yEnd],[xEnd,y],[xEnd,yMid],[xEnd,yEnd]];
  for (let i = 0; i < 8; i++ ){
    newCirc = '<circle id="'+id+'_'+i+'" r="5" cx="'+pos[i][0]+'" cy="'+pos[i][1]+'" fill="white" stroke="black"/>'
    area.insertAdjacentHTML('beforeend', newCirc);
    circs[i] = document.getElementById(id+"_"+i)
    circs[i].addEventListener("mousedown",expand);
  }
}

function changeCircles(){
  x = +selected.getAttribute('x');
  y = +selected.getAttribute('y');
  width = +selected.getAttribute('width');
  height = +selected.getAttribute('height');
  id = selected.getAttribute('id');
  
  yMid = y+(height/2)
  yEnd = y+height
  
  xMid = x+(width/2)
  xEnd = x+width

  let pos = [[x,y],[x,yMid],[x,yEnd],[xMid,y],[xMid,yEnd],[xEnd,y],[xEnd,yMid],[xEnd,yEnd]]
  
  for (let i = 0; i<8; i++){
    circs[i].setAttribute("cx",pos[i][0])
    circs[i].setAttribute("cy",pos[i][1])
  }
 
}

function removeCircles(){
  id = selected.getAttribute('id');
  for (let i = 0; i < 8; i++){
    circs[i].remove();
    circs[i] = null;
  }
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
  x = +selected.getAttribute('x');
  newX = e.clientX;
  
  width = +selected.getAttribute('width');
  newWidth = width + (x - newX);
  
  if (newWidth >10){
    selected.setAttribute('x',newX);
    selected.setAttribute('width',newWidth);
    changeCircles();
    changeText();
  }
}

function expandRight(e){
  x = +selected.getAttribute('x');
  newWidth = e.clientX - x;
  
  if (newWidth >10){
    selected.setAttribute('width',newWidth);
    changeCircles();
    changeText();
  }
}

function expandUp(e){
  y = +selected.getAttribute('y');
  newY = e.clientY;
  
  
  height = +selected.getAttribute('height');
  newHeight = height + (y - newY); 
  if (newHeight >10){
    selected.setAttribute('y',newY);
    selected.setAttribute('height',newHeight);
    changeCircles();
    changeText();
  }
}

function expandDown(e){
  y = +selected.getAttribute('y');
  newHeight = e.clientY - y;
  
  if (newHeight >10){
    selected.setAttribute('height',newHeight);
    changeCircles();
    changeText();
  }
}

