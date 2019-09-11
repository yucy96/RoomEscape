var program;
var canvas, gl;

const MAX_OBJECT = 33;
const MAX = 65532;
var speed=10;
var lookConfig = [[-15.0, 50.0, -10.0], [-15.0, 50.0, 0.0], [0.0, 1.0, 0]];
var lightColor = [0.5, 0.5, 0.5];
var backgroundColor = [0.9, 0.9, 0.9, 1.0];
var tempColorList = new Float32Array(3 * MAX_OBJECT);
var angle = [0,0,0];
var lightP = [-15,120,5];

var animationID;
var modelObject = [];
var mtlArray = [];
var objArray = [];
var TextureArray = [];
var loadTextures = 0; //load status
var modelMatrix = mat4();
var viewProjMatrix;
var modelDrawInfo = [];


for(var ii=0; ii<MAX_OBJECT; ii++){
    tempColorList[ii*3] = (Math.floor(255/MAX_OBJECT)/255).toFixed(2) * (ii+1);
    tempColorList[ii*3+1] = (Math.floor(255/MAX_OBJECT)/255).toFixed(2) * (ii+1);
    tempColorList[ii*3+2] = (Math.floor(255/MAX_OBJECT)/255).toFixed(2) * (ii+1);
}


// Objects transformations
function updateDrawInfo(index,someDrawInfo){
    if(!modelDrawInfo[index])
        modelDrawInfo[index]={};

    //Rotate
    modelDrawInfo[index].rotateX=someDrawInfo[0];
    modelDrawInfo[index].rotateY=someDrawInfo[1];
    modelDrawInfo[index].rotateZ=someDrawInfo[2];

    //Translate
    modelDrawInfo[index].transX=someDrawInfo[3];
    modelDrawInfo[index].transY=someDrawInfo[4];
    modelDrawInfo[index].transZ=someDrawInfo[5];

    //Scale
    modelDrawInfo[index].scaleX=someDrawInfo[6];
    modelDrawInfo[index].scaleY=someDrawInfo[7];
    modelDrawInfo[index].scaleZ=someDrawInfo[8];

    //If show the object
    modelDrawInfo[index].ifShow=someDrawInfo[9];

}

var jjjj = 0;

function getDrawingInfo(ifTexture) {
    // Create an arrays for vertex coordinates, normals, colors, and indices
    var numIndices = 0;
    for(var i = 0; i < this.objects.length; i++){
        numIndices += this.objects[i].numIndices;
    }
    var numVertices = numIndices;
    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var colors = new Float32Array(numVertices * 4);
    var indices = new Uint16Array(numIndices);
    var textureVt = new Float32Array(numVertices * 3);

    // Set vertex, normal, texture and color
    var index_indices = 0;
    for(i = 0; i < this.objects.length; i++){
        var object = this.objects[i];
        //if(jjjj<1)console.log("object.faces.length",object.faces.length,this.objects.length);
        for(var j = 0; j < object.faces.length; j++){
            var face = object.faces[j];
            var color = findColor(this,face.materialName);
            var faceNormal = face.normal;
            for(var k = 0; k < face.vIndices.length; k++){
                // Set index
                indices[index_indices] = index_indices%MAX;
                // Copy vertex
                var vIdx = face.vIndices[k];
                var vertex = this.vertices[vIdx];
                vertices[index_indices * 3    ] = vertex.x;
                vertices[index_indices * 3 + 1] = vertex.y;
                vertices[index_indices * 3 + 2] = vertex.z;

                var tIdx = face.tIndices[k];
                var Tvertex = this.textureVt[tIdx];
                if(Tvertex) {
                    textureVt[index_indices * 3] = Tvertex.x;
                    textureVt[index_indices * 3 + 1] = Tvertex.y;
                    textureVt[index_indices * 3 + 2] = ifTexture;
                }
                else{
                    textureVt[index_indices * 3] = 0;
                    textureVt[index_indices * 3 + 1] = 0;
                    textureVt[index_indices * 3 + 2] = ifTexture;
                }

                // Copy color
                colors[index_indices * 4    ] = color.r;
                colors[index_indices * 4 + 1] = color.g;
                colors[index_indices * 4 + 2] = color.b;
                colors[index_indices * 4 + 3] = color.a;

                // Copy normal
                var nIdx = face.nIndices[k];
                if(nIdx >= 0){
                    var normal = this.normals[nIdx];
                    normals[index_indices * 3    ] = normal.x;
                    normals[index_indices * 3 + 1] = normal.y;
                    normals[index_indices * 3 + 2] = normal.z;
                }else{
                    normals[index_indices * 3    ] = faceNormal.x;
                    normals[index_indices * 3 + 1] = faceNormal.y;
                    normals[index_indices * 3 + 2] = faceNormal.z;
                }
                index_indices ++;
            }
            jjjj++;
        }
    }
    return new DrawingInfo(vertices, normals, colors, indices, textureVt);
}

var ready = true;

function onReadComplete(gl, model, target,begin,numbers,ifTexture) {

    var drawingInfo = getDrawingInfo.call(target,ifTexture);
    if(ready) {
        console.log(drawingInfo, "drawingInfo");
        ready = !ready;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices.slice(begin*3,(begin+numbers)*3), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals.slice(begin*3,(begin+numbers)*3), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors.slice(begin*4,(begin+numbers)*4), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.textBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.textureVt.slice(begin*3,(begin+numbers)*3), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices.slice(begin,begin+numbers), gl.STATIC_DRAW);

    return drawingInfo;
}


window.onload = function main() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    // Set the clear color and enable the depth test
    gl.clearColor( ...(backgroundColor) );
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of attribute and uniform variables
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.a_TextCord = gl.getAttribLocation(program, 'a_TextCord');
    program.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    program.u_lightColor = gl.getUniformLocation(program, 'u_lightColor');
    program.u_Clicked = gl.getUniformLocation(program, 'u_Clicked');
    program.u_tempColor = gl.getUniformLocation(program, 'u_tempColor');
    program.eye_Position = gl.getUniformLocation(program, 'eye_Position');
    program.u_light_position = gl.getUniformLocation(program, 'u_light_position');

    if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 || program.a_TextCord <0 ||
        !program.projectionMatrix || !program.u_NormalMatrix) {
        console.log('attribute, uniform failure');
        return;
    }

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, program);
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }

    loadObjects();

    eventHandlers(canvas, angle, gl, model);

    var tick = function() {
        if(loadTextures<=0){
            initDraw(gl);
            for(var ii=0;ii<modelObject.length;ii++){
                render(gl, program, angle, model,ii,TextureArray);
            }
        }
        animationID = requestAnimationFrame(tick);
    };


    for(var ii=0;ii<TextureArray.length;ii++){
        if(TextureArray[ii].TextureUrl!=="none" && TextureArray[ii].TextureUrl!=="repeat"){
            loadTextures++;
            initTextures(gl, TextureArray[ii]);
        }
    }

    tick();

};


function eventHandlers(canvas, currentAngle, gl, model) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse
    var circleX = 314,currentX=0;  // Current x position, currentX/circleX is the angle phi around y axis (100*pi)

    canvas.addEventListener("mousedown", function(ev){
        var x = ev.clientX, y = ev.clientY;

        // Start dragging if a moue is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x; lastY = y;
            dragging = true;
        }
        var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;

        var articleID = checkPixel(gl, model, x_in_canvas,  y_in_canvas);
        document.getElementById("found").innerHTML = reaction(articleID);
        //console.log("articleID",articleID);

    });

    canvas.addEventListener("mouseup", function(ev){dragging = false;  });

    canvas.addEventListener("mousemove", function(ev){
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);

            currentX+=dx*4;

            lookConfig[1][0]=Math.sin(currentX/circleX) * 10 + lookConfig[0][0];
            lookConfig[1][2]=Math.cos(currentX/circleX) * 10 + lookConfig[0][2];

            lookConfig[1][1]+=dy*0.4;

            // Limit x-axis rotation angle to [-90, 90]
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x;
        lastY = y;

    });

    document.addEventListener('keydown', function (event) {

        switch (event.keyCode) {
            case 87:
                GoForward(speed);
                break;
            case 83:
                GoBack(speed);
                break;
            case 65:
                GoLeft(speed);
                break;
            case 68:
                GoRight(speed);
                break;
            case 90:
                GoDown(speed);
                break;
            case 88:
                GoUp(speed);
                break;
        }

    }, false);



    function GoBack(speed){
            lookConfig[0][0] -= Math.sin(currentX / circleX) * speed;
            lookConfig[0][2] -= Math.cos(currentX / circleX) * speed;
            lookConfig[1][0] -= Math.sin(currentX / circleX) * speed;
            lookConfig[1][2] -= Math.cos(currentX / circleX) * speed;
        if (lookConfig[0][2] < -160 || lookConfig[0][2] > 180) {
            lookConfig[0][2] += Math.cos(currentX / circleX) * speed;
            lookConfig[1][2] += Math.cos(currentX / circleX) * speed;
        }
        if (lookConfig[0][0] < -85 || lookConfig[0][0] > 45) {
            lookConfig[0][0] += Math.sin(currentX / circleX) * speed;
            lookConfig[1][0] += Math.sin(currentX / circleX) * speed;
        }
    }

    function GoForward(speed){
            lookConfig[0][0] += Math.sin(currentX / circleX) * speed;
            lookConfig[0][2] += Math.cos(currentX / circleX) * speed;
            lookConfig[1][0] += Math.sin(currentX/circleX)*speed;
            lookConfig[1][2] += Math.cos(currentX/circleX)*speed;
        if (lookConfig[0][2] < -160 || lookConfig[0][2] > 180) {
            lookConfig[0][2] -= Math.cos(currentX / circleX) * speed;
            lookConfig[1][2] -= Math.cos(currentX / circleX) * speed;
        }
        if (lookConfig[0][0] < -85 || lookConfig[0][0] > 45) {
            lookConfig[0][0] -= Math.sin(currentX / circleX) * speed;
            lookConfig[1][0] -= Math.sin(currentX / circleX) * speed;
        }
    }

    function GoLeft(speed){
            lookConfig[0][0]+=Math.cos(currentX/circleX)*speed;
            lookConfig[0][2]-=Math.sin(currentX/circleX)*speed;
            lookConfig[1][0]+=Math.cos(currentX/circleX)*speed;
            lookConfig[1][2]-=Math.sin(currentX/circleX)*speed;
        if (lookConfig[0][2] < -160 || lookConfig[0][2] > 180) {
            lookConfig[0][2] += Math.sin(currentX/circleX)*speed;
            lookConfig[1][2] += Math.sin(currentX/circleX)*speed;
        }
        if (lookConfig[0][0] < -85 || lookConfig[0][0] > 45) {
            lookConfig[0][0] -= Math.cos(currentX/circleX)*speed;
            lookConfig[1][0] -= Math.cos(currentX/circleX)*speed;
        }
    }

    function GoRight(speed){
            lookConfig[0][0] -= Math.cos(currentX / circleX) * speed;
            lookConfig[0][2] += Math.sin(currentX / circleX) * speed;
            lookConfig[1][0] -= Math.cos(currentX / circleX) * speed;
            lookConfig[1][2] += Math.sin(currentX / circleX) * speed;
        if (lookConfig[0][2] < -160 || lookConfig[0][2] > 180) {
            lookConfig[0][2] -= Math.sin(currentX/circleX)*speed;
            lookConfig[1][2] -= Math.sin(currentX/circleX)*speed;
        }
        if (lookConfig[0][0] < -85 || lookConfig[0][0] > 45) {
            lookConfig[0][0] += Math.cos(currentX/circleX)*speed;
            lookConfig[1][0] += Math.cos(currentX/circleX)*speed;
        }
    }

    function GoDown(speed){
        lookConfig[0][1]-=speed;
        lookConfig[1][1]-=speed;
        if (lookConfig[0][1]<=5) {
            lookConfig[0][1]+=speed;
            lookConfig[1][1]+=speed;
        }
    }

    function GoUp(speed){
        lookConfig[0][1]+=speed;
        lookConfig[1][1]+=speed;
        if (lookConfig[0][1]>=50) {
            lookConfig[0][1]-=speed;
            lookConfig[1][1]-=speed;
        }
    }
    function reaction(id){
        switch(id){
            case 1:
                return "This is a room modified from Vincent Van Gogh's painting.";
            case 4:
                return "Van Gogh was shot in the stomach on July 29th 1890, and died in bed two days later.";
            case 7:
                return "There's nothing behind the curtain.";
            case 10:
                return "A pistol?";
            case 11:
                return "A vase, but there aren't any sunflowers.";
            case 12:
                TextureArray[15].ifTexture = true;
                return "Van Gogh sent the ear to someone he loved.";
            case 13:
                return "Van Gogh's self-portrait... However, it's not the most well-known one. Van Gogh cut off his ear after a dispute with Paul Gauguin. Where's the ear?";
            case 14:
                if (TextureArray[18].ifTexture){
                    modelDrawInfo[id-1].ifShow = 0;
                    modelDrawInfo[id].ifShow = 0;
                    return "Something is behind the painting.";
                }
                return "Nothing happened!";
            case 15:
                return "Van Gogh's favourite painting of sunflower.";
            case 16:
                if (TextureArray[15].ifTexture) return "Something's on the pad.";
                else return "A weird pad.";
            case 17:
                return "The door is locked. To unlock, click the keypad on the left to form a pattern, and then press the long button below to confirm.";
            case 18:
                return "Starry night outside.";
            case 19:
                modelDrawInfo[13].ifShow = 1;
                modelDrawInfo[14].ifShow = 1;
                TextureArray[18].ifTexture = false;
                return "A piece of paper. It says, 'how many flowers in the painting?' ";
            case 20:
                return "Van Gogh was born in 1853, but he wasn't a born painter. He started his career as a painter in his late twenties.";
            case 21:
                return "Besides flowers, Van Gogh also had other still life works.";
            case 22:
                return "A table to put objects on during painting.";
            case 23:
                return "What is Van Gogh's age at death?";

            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
            case 31:
            case 32:
                TextureArray[id-1].ifTexture = !TextureArray[id-1].ifTexture;
                if (TextureArray[id-1].ifTexture) return "Key pressed.";
                else return "Key unpressed.";
            case 33:
                if (TextureArray[23].ifTexture && !TextureArray[24].ifTexture && TextureArray[25].ifTexture
                && !TextureArray[26].ifTexture && TextureArray[27].ifTexture && !TextureArray[28].ifTexture
                && TextureArray[29].ifTexture && !TextureArray[30].ifTexture && !TextureArray[31].ifTexture){
                    alert( "Congrats, the door is unlocked!" );
                    return "Key confirmed!"
                }
                else return "Wrong key!"

        }
        return "Nothing happened!";
    }
}

function initVertexBuffers(gl, program) {
    var o = {};
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.textBuffer = createEmptyArrayBuffer(gl, program.a_TextCord, 3, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.textBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, true, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return buffer;
}


function initTextures(gl,thisTexture) {
    console.log(gl,"image to onload ..",gl);
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    var u_Sampler = gl.getUniformLocation(program, 'u_Sampler');

    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    var image = new Image();  // Create the image object
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){
        console.log("image onload");
        loadTexture(gl, thisTexture.n, texture, image);
    };
    // Tell the browser to load an image
    image.src = thisTexture.TextureUrl;

    return true;
}

function loadTexture(gl, n, texture, image) {
    var TextureList = [gl.TEXTURE0,gl.TEXTURE1,gl.TEXTURE2,gl.TEXTURE3,gl.TEXTURE4,gl.TEXTURE5,
        gl.TEXTURE6,gl.TEXTURE7, gl.TEXTURE8, gl.TEXTURE9,gl.TEXTURE10,gl.TEXTURE11,
        gl.TEXTURE12,gl.TEXTURE13,gl.TEXTURE14, gl.TEXTURE15, gl.TEXTURE16, gl.TEXTURE17,
        gl.TEXTURE18];

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit0
    gl.activeTexture(TextureList[n]);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    loadTextures-=1;

}


var tttt = 0;

function initDraw(gl){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers
    gl.uniform3f(program.u_light_position,lightP[0],lightP[1],lightP[2]);
    gl.uniform3f(program.u_lightColor,lightColor[0],lightColor[1],lightColor[2]);
    gl.uniform3f(program.eye_Position,lookConfig[0],lookConfig[1],lookConfig[2]);
    gl.uniform1f(program.u_Clicked,0.0);
}


function render(gl, program, angle, model, index, TextureArray) {

    if(!modelDrawInfo[index].ifShow) return;

    viewProjMatrix = perspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);
    viewProjMatrix = mult(viewProjMatrix, lookAt(...(lookConfig)));


    if(!objArray[index]){
        console.log("no object!");
        return;
    }

    if(TextureArray[index].ifTexture){
        var u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
        gl.uniform1i(u_Sampler, TextureArray[index].n);
    }

    var numIndices = 0;
    for(var i = 0; i < modelObject[index].objects.length; i++){
        numIndices += modelObject[index].objects[i].numIndices;
        //每一个objects[i].numIndices 是它的所有的face的顶点数加起来
    }

    gl.uniform4f(program.u_tempColor,tempColorList[index*3],tempColorList[index*3+1],tempColorList[index*3+2],1);


    var g_drawingInfo;
    var g_objDoc;
    for (var ii = 0; ii < Math.ceil(numIndices / MAX); ii++) {
        //if (tttt < 1) console.log("when tttt < 1", numIndices, (numIndices - ii * MAX) < MAX ? (numIndices - ii * MAX) : MAX);
        g_drawingInfo = onReadComplete(gl, model, modelObject[index], ii * MAX, (numIndices - ii * MAX) < MAX ? (numIndices - ii * MAX) : MAX, TextureArray[index].ifTexture);
        g_objDoc = null;

        modelMatrix = translate(modelDrawInfo[index].transX, modelDrawInfo[index].transY, modelDrawInfo[index].transZ);
        modelMatrix = mult(modelMatrix, rotate(modelDrawInfo[index].rotateX, [1.0, 0.0, 0.0]));
        modelMatrix = mult(modelMatrix, rotate(modelDrawInfo[index].rotateY, [0.0, 1.0, 0.0]));
        modelMatrix = mult(modelMatrix, rotate(modelDrawInfo[index].rotateZ, [0.0, 0.0, 1.0]));
        modelMatrix = mult(modelMatrix, scalem(modelDrawInfo[index].scaleX, modelDrawInfo[index].scaleY, modelDrawInfo[index].scaleZ));

        //if (tttt < 1) console.log(modelMatrix, modelDrawInfo[index], "modelMatrix");

        gl.uniformMatrix4fv(program.u_NormalMatrix, false, flatten(transpose(inverse(modelMatrix))));
        gl.uniformMatrix4fv(program.u_ModelMatrix, false, flatten(modelMatrix));
        gl.uniformMatrix4fv(program.projectionMatrix, false, flatten(mult(viewProjMatrix, modelMatrix)));

        gl.drawElements(gl.TRIANGLES, (numIndices - ii * MAX) < MAX ? (numIndices - ii * MAX) : MAX, gl.UNSIGNED_SHORT, 0);
    }

    tttt++;

}

// Check which object is selected
function checkPixel(gl, model, x, y){

    gl.uniform1f(program.u_Clicked,1.0);
    var pixels = new Uint8Array(4);

    for(var ii=0;ii<modelObject.length;ii++){
        render(gl, program, angle, model,ii,TextureArray);
    }

    gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    //console.log("Click info:",parseInt((pixels[0]/(255/MAX_OBJECT)).toFixed(0)),x,y,pixels);


    gl.uniform1f(program.u_Clicked,0.0);

    return (parseInt((pixels[0]/(255/MAX_OBJECT)).toFixed(0)));

}

function loadObjects() {
    // 1. room
    readOBJFile('./models/cube.obj', modelObject,  mtlArray, objArray, 200, false, 0);
    TextureArray[0]={ifTexture:true,TextureUrl:'./textures/wallpaper1.jpg',n:0};
    updateDrawInfo(0,[0.0,0.0,0.0, -20.0,40.0,15.0, 0.4,0.38,0.9,1]);
    //2.  chair next to bed
    readOBJFile('./models/Chair.obj', modelObject,  mtlArray, objArray, 0.2, false, 1);
    TextureArray[1]={ifTexture:true,TextureUrl:'./textures/wood1.jpg',n:1};
    updateDrawInfo(1,[0.0,135.0,0.0, -100,-20,60.0, 1.0,1.0,1.0,1]);
    // 3. chair next to closet
    readOBJFile('./models/Chair.obj', modelObject,  mtlArray, objArray, 0.2, false, 2);
    TextureArray[2]={ifTexture:true,TextureUrl:'repeat',n:1};
    updateDrawInfo(2,[0.0,180.0,0.0, -120,-20,-20.0, 1.0,1.0,1.0,1]);
    // 4. bed
    readOBJFile('./models/Bed.obj', modelObject,  mtlArray, objArray, 30, false, 3);
    TextureArray[3]={ifTexture:true,TextureUrl:'./models/Texture.jpg',n:2};
    updateDrawInfo(3,[0.0,180.0,0.0, -65,0,130.0, 1.0,1.5,1.2,1]);
    // 5. bedside table
    readOBJFile('./models/console_table.obj', modelObject,  mtlArray, objArray, 1, false, 4);
    TextureArray[4]={ifTexture:true,TextureUrl:'./textures/wood4.jpg',n:3};
    updateDrawInfo(4,[0.0,210.0,0.0, 30,-20,160.0, 0.5,1,2,1]);
    // 6. selfie frame
    readOBJFile('./models/frame.obj', modelObject,  mtlArray, objArray, 0.1, false, 5);
    TextureArray[5]={ifTexture:true,TextureUrl:'repeat',n:3};
    updateDrawInfo(5,[0.0,270.0,0.0, -99,70,120.0, 0.45,0.82,1.0,1]);
    // 7. curtain
    readOBJFile('./models/Curtain.obj', modelObject,  mtlArray, objArray, 0.025, false, 6);
    TextureArray[6]={ifTexture:true,TextureUrl:'./models/40_B.jpg',n:4};
    updateDrawInfo(6,[0.0,180.0,0.0, 0.0,35,187, 0.8,1.0,1.0,1]);
    // 8. window frame
    readOBJFile('./models/frame.obj', modelObject,  mtlArray, objArray, 0.2, false, 7);
    TextureArray[7]={ifTexture:true,TextureUrl:'./textures/wood9.jpg',n:5};
    updateDrawInfo(7,[0.0,180.0,0.0, -22.0,75,195, 0.75,1.0,1.0,1]);
    // 9. floor
    readOBJFile('./models/floor.obj', modelObject,  mtlArray, objArray, 200, false, 8);
    TextureArray[8]={ifTexture:true,TextureUrl:'./textures/wood3.jpg',n:6};
    updateDrawInfo(8,[0.0,90.0,0.0, -20.0,-20,0.0, 0.75,1.0,0.5,1]);
    // 10. pistol
    readOBJFile('./models/Pistol.obj', modelObject,  mtlArray, objArray, 0.5, false, 9);
    TextureArray[9]={ifTexture:true,TextureUrl:'./models/Pistol_color.jpg',n:7};
    updateDrawInfo(9,[0.0,30.0,0.0, 35.0,13,150.0, 1.0,1.0,1.0,1]);
    // 11. vase
    readOBJFile('./models/vase_01.obj', modelObject,  mtlArray, objArray, 0.8, false, 10);
    TextureArray[10]={ifTexture:true,TextureUrl:'./textures/orange.jpg',n:8};
    updateDrawInfo(10,[0.0,30.0,0.0, 30.0,12,160.0, 1.0,1.0,1.0,1]);
    // 12. ear
    readOBJFile('./models/ear1.obj', modelObject,  mtlArray, objArray, 0.8, false, 11);
    TextureArray[11]={ifTexture:true,TextureUrl:'./textures/skintexture_06.png',n:9};
    updateDrawInfo(11,[0.0,180.0,90.0, -80.0,-15,100.0, 1.0,1.0,1.0,1]);
    // 13. selfie
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 50, false, 12);
    TextureArray[12]={ifTexture:true,TextureUrl:'./textures/paint1.jpg',n:10};
    updateDrawInfo(12,[0.0,90.0,0.0, -100,70,120.0, 1.1,1.3,1,1]);
    // 14. sunflower frame
    readOBJFile('./models/frame.obj', modelObject,  mtlArray, objArray, 0.1, false, 13);
    TextureArray[13]={ifTexture:true,TextureUrl:'repeat',n:3};
    updateDrawInfo(13,[0.0,180.0,0.0, 40,70,190, 0.45,0.82,1.0,1]);
    // 15. sunflower
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 50, false, 14);
    TextureArray[14]={ifTexture:true,TextureUrl:'./textures/sunflower.jpg',n:11};
    updateDrawInfo(14,[0.0,0.0,0.0, 40,70,190, 1,1.25,1,1]);
    // 16. solution paper
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 25, false, 15);
    TextureArray[15]={ifTexture:false,TextureUrl:'./textures/solution.png',n:18};
    updateDrawInfo(15,[90.0,0.0,0.0, -80.0,-15,60.0, 1.0,1.0,1.0,1]);
    // 17. door
    readOBJFile('./models/door.obj', modelObject,  mtlArray, objArray, 0.5, false, 16);
    TextureArray[16]={ifTexture:true,TextureUrl:'repeat',n:5};
    updateDrawInfo(16,[270.0,0.0,90.0, -100,-20,-50.0, 1,1.25,1,1]);
    // 18. starry night
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 180, false, 17);
    TextureArray[17]={ifTexture:true,TextureUrl:'./textures/Starry_Night.jpg',n:12};
    updateDrawInfo(17,[0.0,0.0,0.0, -22.0,75,195, 1,0.82,1.0,1]);
    // 19. q1
    readOBJFile('./models/paper1.obj', modelObject,  mtlArray, objArray, 10, false, 18);
    TextureArray[18]={ifTexture:true,TextureUrl:'./textures/q1.png',n:13};
    updateDrawInfo(18,[0.0,0.0,0.0, 50,60,195, 1,0.82,0.1,1]);
    // 20. easel
    readOBJFile('./models/easel.obj', modelObject,  mtlArray, objArray, 50, false, 19);
    TextureArray[19]={ifTexture:true,TextureUrl:'./textures/wood4.jpg',n:3};
    updateDrawInfo(19,[-90.0,0.0,0.0, 20,-20,-100, 1,1,1,1]);
    // 21. still life
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 120, false, 20);
    TextureArray[20]={ifTexture:true,TextureUrl:'./textures/still_life.jpg',n:14};
    updateDrawInfo(20,[-12.0,0.0,0.0, 20,50,-90, 1.05,0.82,0.3,1]);
    // 22. table
    readOBJFile('./models/console_table.obj', modelObject,  mtlArray, objArray, 1, false, 21);
    TextureArray[21]={ifTexture:true,TextureUrl:'./textures/wood5.jpg',n:15};
    updateDrawInfo(21,[0.0,75.0,0.0, -50,-20,-130, 1,1,2,1]);
    // 23. q2
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 120, false, 22);
    TextureArray[22]={ifTexture:true,TextureUrl:'./textures/q2.png',n:16};
    updateDrawInfo(22,[-12.0,0.0,0.0, 20,50,-90.3, 1.05,0.82,0.3,1]);
    // 24 ~ 32. keyboard
   var box = 23; //23 to 31
    for (var n = 0; n < 3; n++){
        for (var m = 0; m < 3; m++){
            readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 10, false, box);
            TextureArray[box]={ifTexture:false,TextureUrl:'./textures/colorful2.jpg',n:17};
            updateDrawInfo(box,[0.0,90.0,0.0, -100, 50-5*n, 0.0-5*m, 1,1,1,1]);
            box ++;
        }
    }
    // 33. confirm key
    readOBJFile('./models/october-painting2.obj', modelObject,  mtlArray, objArray, 10, false, box);
    TextureArray[box]={ifTexture:false,TextureUrl:'./textures/colorful2.jpg',n:17};
    updateDrawInfo(box,[0.0,90.0,0.0, -100, 35, -5, 2,1,1,1]);

}