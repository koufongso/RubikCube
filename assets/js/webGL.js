window.onload = main;

function main() {
    const canvas = document.getElementById("display");
    const gl = canvas.getContext("webgl");
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // define vertex shader source code
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uTransformMatrix;

        varying lowp vec4 vColor;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix *uTransformMatrix*aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    // define fragement shader source code
    const fsSource = `
        varying lowp vec4 vColor;

        void main(){
            gl_FragColor = vColor;
        }
    `;

    // compile shader
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const shaderInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            transformMatrix: gl.getUniformLocation(shaderProgram, 'uTransformMatrix'),

        },
    }

    let rbcube = new RubikCube(gl, shaderInfo);

    rbcube.draw();





    {// view port control
        let trackMouse = false; // state to indicate if tracking mouse
        let x0, y0;             // use to track the mouse moving direction

        canvas.onwheel = function (event) {// wheel to control zoom in/out
            event.preventDefault();
            rbcube.zoom(event.wheelDelta / 150);
        }

        // mouse press on the canvas, start tracking
        canvas.onmousedown = function (event) {
            event.preventDefault();
            x0 = event.clientX;
            y0 = event.clientY;
            trackMouse = true;
        }

        // stop tracking mouse
        canvas.onmouseup = function (event) {
            trackMouse = false;
        }

        canvas.onmouseleave = function (event) {
            trackMouse = false;
        }

        // if tracking moues, compute the mouse moving direction and pass it to the rubik cube object
        canvas.onmousemove = function (event) {
            if (trackMouse) {
                dx = event.clientX - x0;
                dy = event.clientY - y0;

                /* dx rotate around y axis,
                 * dy rotate around x axis,
                 */
                rbcube.moveCameraView(dy, dx, 0);

                // update for next event
                x0 = event.clientX;
                y0 = event.clientY;
            }
        }
    }


    {// rotation button
        document.getElementById("rotate-cw-0").onclick = function () { rbcube.rotate(0, Math.PI / 2, [0, 0, -1]); }
        document.getElementById("rotate-ccw-0").onclick = function () { rbcube.rotate(0, Math.PI / 2, [0, 0, 1]); }

        document.getElementById("rotate-cw-1").onclick = function () { rbcube.rotate(1, Math.PI / 2, [0, 0, -1]); }
        document.getElementById("rotate-ccw-1").onclick = function () { rbcube.rotate(1, Math.PI / 2, [0, 0, 1]); }

        document.getElementById("rotate-cw-2").onclick = function () { rbcube.rotate(2, Math.PI / 2, [0, 0, -1]); }
        document.getElementById("rotate-ccw-2").onclick = function () { rbcube.rotate(2, Math.PI / 2, [0, 0, 1]); }

        document.getElementById("rotate-cw-3").onclick = function () { rbcube.rotate(3, Math.PI / 2, [0, -1, 0]); }
        document.getElementById("rotate-ccw-3").onclick = function () { rbcube.rotate(3, Math.PI / 2, [0, 1, 0]); }

        document.getElementById("rotate-cw-4").onclick = function () { rbcube.rotate(4, Math.PI / 2, [0, -1, 0]); }
        document.getElementById("rotate-ccw-4").onclick = function () { rbcube.rotate(4, Math.PI / 2, [0, 1, 0]); }

        document.getElementById("rotate-cw-5").onclick = function () { rbcube.rotate(5, Math.PI / 2, [0, -1, 0]); }
        document.getElementById("rotate-ccw-5").onclick = function () { rbcube.rotate(5, Math.PI / 2, [0, 1, 0]); }

        document.getElementById("rotate-cw-6").onclick = function () { rbcube.rotate(6, Math.PI / 2, [-1, 0, 0]); }
        document.getElementById("rotate-ccw-6").onclick = function () { rbcube.rotate(6, Math.PI / 2, [1, 0, 0]); }

        document.getElementById("rotate-cw-7").onclick = function () { rbcube.rotate(7, Math.PI / 2, [-1, 0, 0]); }
        document.getElementById("rotate-ccw-7").onclick = function () { rbcube.rotate(7, Math.PI / 2, [1, 0, 0]); }

        document.getElementById("rotate-cw-8").onclick = function () { rbcube.rotate(8, Math.PI / 2, [-1, 0, 0]); }
        document.getElementById("rotate-ccw-8").onclick = function () { rbcube.rotate(8, Math.PI / 2, [1, 0, 0]); }
    }


    {// timer
        let stopWatchHandle = null;
        let timerOn = false;
        let t = 0; //ms

        let start = document.getElementById("btn-start");
        let timeDiv = document.getElementById("timer");

        function stopWatch() {
            t++;
            let ss = (t % 60).toString().padStart(2, 0);
            let mm = (Math.floor(t / 60)).toString().padStart(2, 0);
            timeDiv.innerHTML = `${mm}:${ss}`;
        }

        function resetTimer() {
            clearInterval(stopWatchHandle);
            t = 0;
            timeDiv.innerHTML = `00:00`;
        }

        start.onclick = function (event) {
            if (!timerOn) {
                start.innerHTML = "Stop";
                start.classList.replace("btn-primary","btn-danger");
                stopWatchHandle = setInterval(stopWatch, 1000);
                timerOn = true;
            } else {
                start.innerHTML = "Start Timer";
                start.classList.replace("btn-danger","btn-primary");
                resetTimer();
                timerOn = false;
            }
        }

        let newGame = document.getElementById("btn-newGame");
        newGame.onclick = function () {
            resetTimer();
            for (let i = 0; i < 20; i++) {
                let f = Math.floor(Math.random() * 9);
                let dir = Math.floor(Math.random()) == 0 ? -1 : 1;
                let axis;
                switch (f) {
                    case 0:
                    case 1:
                    case 2:
                        axis = [0, 0, dir];
                        break;
                    case 3:
                    case 4:
                    case 5:
                        axis = [0, dir, 0];
                        break;
                    case 6:
                    case 7:
                    case 8:
                        axis = [dir, 0, 0];
                        break;
                }
                rbcube.rotate(f, Math.PI / 2, axis);
            }
        }

    }




}






















