const cc = [ //  center of each cubes
    // 1 layer
    0.0, 0.0, 0.0,
    2.0, 0.0, 0.0,
    2.0, 2.0, 0.0,
    0.0, 2.0, 0.0,
    -2.0, 2.0, 0.0,
    -2.0, 0.0, 0.0,
    -2.0, -2.0, 0.0,
    0.0, -2.0, 0.0,
    2.0, -2.0, 0.0,

    // 2 layer
    0.0, 0.0, 2.0,
    2.0, 0.0, 2.0,
    2.0, 2.0, 2.0,
    0.0, 2.0, 2.0,
    -2.0, 2.0, 2.0,
    -2.0, 0.0, 2.0,
    -2.0, -2.0, 2.0,
    0.0, -2.0, 2.0,
    2.0, -2.0, 2.0,

    0.0, 0.0, -2.0,
    2.0, 0.0, -2.0,
    2.0, 2.0, -2.0,
    0.0, 2.0, -2.0,
    -2.0, 2.0, -2.0,
    -2.0, 0.0, -2.0,
    -2.0, -2.0, -2.0,
    0.0, -2.0, -2.0,
    2.0, -2.0, -2.0,
];

// vertex drawing order
const indices = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
];

class RubikCube {
    constructor(gl, programInfo) {
        this.gl = gl;
        this.programInfo = programInfo;

        this.cubes = [];
        for (let i = 0; i < 27; i++) {
            let j = 3 * i;
            this.cubes.push(new Cube(gl, cc[j], cc[j + 1], cc[j + 2]));
        }

        // connect cubes to the corresponding faces
        this.faces = [
            // z+ --> z-
            [13, 12, 11, 14, 9, 10, 15, 16, 17],
            [4, 3, 2, 5, 0, 1, 6, 7, 8],
            [22, 21, 20, 23, 18, 19, 24, 25, 26],
            // y+ -->y-
            [22, 21, 20, 4, 3, 2, 13, 12, 11],
            [23, 18, 19, 5, 0, 1, 14, 9, 10],
            [24, 25, 26, 6, 7, 8, 15, 16, 17],
            // x+ -->x-
            [11, 2, 20, 10, 1, 19, 17, 8, 26],
            [12, 3, 21, 9, 0, 18, 16, 7, 25],
            [13, 4, 22, 14, 5, 23, 15, 6, 24],
        ];

        this.gl.useProgram(programInfo.program);

        {
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        }


        {// camera view config
            const fieldOfView = 45 * Math.PI / 180;   // in radians
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            const zNear = 0.1;
            const zFar = 100.0;
            this.projectionMatrix = mat4.create();
            mat4.perspective(this.projectionMatrix,
                fieldOfView,
                aspect,
                zNear,
                zFar);
        }

        // camera distance from the world coordinate origin
        this.dist = 0;

        this.modelViewMatrix = mat4.create();
        this.cameraViewMatrix = mat4.create();

        this.setCameraView(20, Math.PI / 4, -Math.PI / 6);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, this.projectionMatrix);
    }

    /* Methods */

    /**
     * Rotate one RubikCube's face
     * @param {*} face Rb Cube face that want to rotate
     * @param {*} theta rotate angle
     * @param {*} axis roate axis reading to the world space
     */
    rotate(face, theta, axis) {
        let _this = this;
        // define the transform matrix for the face
        let transformMatrix = mat4.create();
        mat4.rotate(transformMatrix, transformMatrix, theta, axis);

        // update the cubes vertex (not the buffer);
        for (let i = 0; i < 9; i++) {
            this.cubes[this.faces[face][i]].updateVertexPose(transformMatrix);
        }

        // remap the cubes in faces
        // the rotation face cubes will not change, but need to rearrange
        // the other face cubes will change

        reMap(face, axis);

        {// animate the rotation
            let t_pre = performance.now();
            let rotation = 0.0;

            requestAnimationFrame(render);

            function render(t) {
                let dt = t - t_pre;
                t_pre = t;
                dt *= 0.01;
                rotation += dt;

                for (let i = 0; i < 9; i++) {
                    let animateMatrix = mat4.create();
                    _this.cubes[_this.faces[face][i]].transformMatrix = mat4.rotate(animateMatrix, animateMatrix, rotation, axis);
                }

                _this.draw();

                if (rotation < theta) {
                    requestAnimationFrame(render);
                } else {
                    for (let i = 0; i < 9; i++) {
                        _this.cubes[_this.faces[face][i]].transformMatrix = mat4.create();
                        _this.cubes[_this.faces[face][i]].setBuffer();
                    }
                    _this.draw();
                }
            }
        }

        /**
         * Helper function to remap the cube to the coressponding faces after rotation
         * @param {*} face rotated face
         * @param {*} axis rotate axis
         */
        function reMap(face, axis) {
            let temp = [..._this.faces[face]];

            if (axis[0] > 0 || axis[1] > 0 || axis[2] > 0) {// ccw
                _this.faces[face][0] = temp[2];
                _this.faces[face][1] = temp[5];
                _this.faces[face][2] = temp[8];
                _this.faces[face][3] = temp[1];
                _this.faces[face][4] = temp[4];
                _this.faces[face][5] = temp[7];
                _this.faces[face][6] = temp[0];
                _this.faces[face][7] = temp[3];
                _this.faces[face][8] = temp[6];
            } else {// cw
                _this.faces[face][0] = temp[6];
                _this.faces[face][1] = temp[3];
                _this.faces[face][2] = temp[0];
                _this.faces[face][3] = temp[7];
                _this.faces[face][4] = temp[4];
                _this.faces[face][5] = temp[1];
                _this.faces[face][6] = temp[8];
                _this.faces[face][7] = temp[5];
                _this.faces[face][8] = temp[2];
            }


            // remap adj faces
            switch (face) {
                case 0:
                    _this.faces[3][6] = _this.faces[face][0];
                    _this.faces[3][7] = _this.faces[face][1];
                    _this.faces[3][8] = _this.faces[face][2];

                    _this.faces[4][6] = _this.faces[face][3];
                    _this.faces[4][7] = _this.faces[face][4];
                    _this.faces[4][8] = _this.faces[face][5];

                    _this.faces[5][6] = _this.faces[face][6];
                    _this.faces[5][7] = _this.faces[face][7];
                    _this.faces[5][8] = _this.faces[face][8];

                    _this.faces[6][0] = _this.faces[face][2];
                    _this.faces[6][3] = _this.faces[face][5];
                    _this.faces[6][6] = _this.faces[face][8];

                    _this.faces[7][0] = _this.faces[face][1];
                    _this.faces[7][3] = _this.faces[face][4];
                    _this.faces[7][6] = _this.faces[face][7];

                    _this.faces[8][0] = _this.faces[face][0];
                    _this.faces[8][3] = _this.faces[face][3];
                    _this.faces[8][6] = _this.faces[face][6];
                    break;

                case 1:
                    _this.faces[3][3] = _this.faces[face][0];
                    _this.faces[3][4] = _this.faces[face][1];
                    _this.faces[3][5] = _this.faces[face][2];

                    _this.faces[4][3] = _this.faces[face][3];
                    _this.faces[4][4] = _this.faces[face][4];
                    _this.faces[4][5] = _this.faces[face][5];

                    _this.faces[5][3] = _this.faces[face][6];
                    _this.faces[5][4] = _this.faces[face][7];
                    _this.faces[5][5] = _this.faces[face][8];

                    _this.faces[6][1] = _this.faces[face][2];
                    _this.faces[6][4] = _this.faces[face][5];
                    _this.faces[6][7] = _this.faces[face][8];

                    _this.faces[7][1] = _this.faces[face][1];
                    _this.faces[7][4] = _this.faces[face][4];
                    _this.faces[7][7] = _this.faces[face][7];

                    _this.faces[8][1] = _this.faces[face][0];
                    _this.faces[8][4] = _this.faces[face][3];
                    _this.faces[8][7] = _this.faces[face][6];
                    break;

                case 2:
                    _this.faces[3][0] = _this.faces[face][0];
                    _this.faces[3][1] = _this.faces[face][1];
                    _this.faces[3][2] = _this.faces[face][2];

                    _this.faces[4][0] = _this.faces[face][3];
                    _this.faces[4][1] = _this.faces[face][4];
                    _this.faces[4][2] = _this.faces[face][5];

                    _this.faces[5][0] = _this.faces[face][6];
                    _this.faces[5][1] = _this.faces[face][7];
                    _this.faces[5][2] = _this.faces[face][8];

                    _this.faces[6][2] = _this.faces[face][2];
                    _this.faces[6][5] = _this.faces[face][5];
                    _this.faces[6][8] = _this.faces[face][8];

                    _this.faces[7][2] = _this.faces[face][1];
                    _this.faces[7][5] = _this.faces[face][4];
                    _this.faces[7][8] = _this.faces[face][7];

                    _this.faces[8][2] = _this.faces[face][0];
                    _this.faces[8][5] = _this.faces[face][3];
                    _this.faces[8][8] = _this.faces[face][6];
                    break;

                case 3:
                    _this.faces[0][0] = _this.faces[face][6];
                    _this.faces[0][1] = _this.faces[face][7];
                    _this.faces[0][2] = _this.faces[face][8];

                    _this.faces[1][0] = _this.faces[face][3];
                    _this.faces[1][1] = _this.faces[face][4];
                    _this.faces[1][2] = _this.faces[face][5];

                    _this.faces[2][0] = _this.faces[face][0];
                    _this.faces[2][1] = _this.faces[face][1];
                    _this.faces[2][2] = _this.faces[face][2];

                    _this.faces[6][0] = _this.faces[face][8];
                    _this.faces[6][1] = _this.faces[face][5];
                    _this.faces[6][2] = _this.faces[face][2];

                    _this.faces[7][0] = _this.faces[face][7];
                    _this.faces[7][1] = _this.faces[face][4];
                    _this.faces[7][2] = _this.faces[face][1];

                    _this.faces[8][0] = _this.faces[face][6];
                    _this.faces[8][1] = _this.faces[face][3];
                    _this.faces[8][2] = _this.faces[face][0];
                    break;

                case 4:
                    _this.faces[0][3] = _this.faces[face][6];
                    _this.faces[0][4] = _this.faces[face][7];
                    _this.faces[0][5] = _this.faces[face][8];

                    _this.faces[1][3] = _this.faces[face][3];
                    _this.faces[1][4] = _this.faces[face][4];
                    _this.faces[1][5] = _this.faces[face][5];

                    _this.faces[2][3] = _this.faces[face][0];
                    _this.faces[2][4] = _this.faces[face][1];
                    _this.faces[2][5] = _this.faces[face][2];

                    _this.faces[6][3] = _this.faces[face][8];
                    _this.faces[6][4] = _this.faces[face][5];
                    _this.faces[6][5] = _this.faces[face][2];

                    _this.faces[7][3] = _this.faces[face][7];
                    _this.faces[7][4] = _this.faces[face][4];
                    _this.faces[7][5] = _this.faces[face][1];

                    _this.faces[8][3] = _this.faces[face][6];
                    _this.faces[8][4] = _this.faces[face][3];
                    _this.faces[8][5] = _this.faces[face][0];
                    break;

                case 5:
                    _this.faces[0][6] = _this.faces[face][6];
                    _this.faces[0][7] = _this.faces[face][7];
                    _this.faces[0][8] = _this.faces[face][8];

                    _this.faces[1][6] = _this.faces[face][3];
                    _this.faces[1][7] = _this.faces[face][4];
                    _this.faces[1][8] = _this.faces[face][5];

                    _this.faces[2][6] = _this.faces[face][0];
                    _this.faces[2][7] = _this.faces[face][1];
                    _this.faces[2][8] = _this.faces[face][2];

                    _this.faces[6][6] = _this.faces[face][8];
                    _this.faces[6][7] = _this.faces[face][5];
                    _this.faces[6][8] = _this.faces[face][2];

                    _this.faces[7][6] = _this.faces[face][7];
                    _this.faces[7][7] = _this.faces[face][4];
                    _this.faces[7][8] = _this.faces[face][1];

                    _this.faces[8][6] = _this.faces[face][6];
                    _this.faces[8][7] = _this.faces[face][3];
                    _this.faces[8][8] = _this.faces[face][0];
                    break;

                case 6:
                    _this.faces[0][2] = _this.faces[face][0];
                    _this.faces[0][5] = _this.faces[face][3];
                    _this.faces[0][8] = _this.faces[face][6];

                    _this.faces[1][2] = _this.faces[face][1];
                    _this.faces[1][5] = _this.faces[face][4];
                    _this.faces[1][8] = _this.faces[face][7];

                    _this.faces[2][2] = _this.faces[face][2];
                    _this.faces[2][5] = _this.faces[face][5];
                    _this.faces[2][8] = _this.faces[face][8];

                    _this.faces[3][8] = _this.faces[face][0];
                    _this.faces[3][5] = _this.faces[face][1];
                    _this.faces[3][2] = _this.faces[face][2];

                    _this.faces[4][8] = _this.faces[face][3];
                    _this.faces[4][5] = _this.faces[face][4];
                    _this.faces[4][2] = _this.faces[face][5];

                    _this.faces[5][8] = _this.faces[face][6];
                    _this.faces[5][5] = _this.faces[face][7];
                    _this.faces[5][2] = _this.faces[face][8];
                    break;

                case 7:
                    _this.faces[0][1] = _this.faces[face][0];
                    _this.faces[0][4] = _this.faces[face][3];
                    _this.faces[0][7] = _this.faces[face][6];

                    _this.faces[1][1] = _this.faces[face][1];
                    _this.faces[1][4] = _this.faces[face][4];
                    _this.faces[1][7] = _this.faces[face][7];

                    _this.faces[2][1] = _this.faces[face][2];
                    _this.faces[2][4] = _this.faces[face][5];
                    _this.faces[2][7] = _this.faces[face][8];

                    _this.faces[3][7] = _this.faces[face][0];
                    _this.faces[3][4] = _this.faces[face][1];
                    _this.faces[3][1] = _this.faces[face][2];

                    _this.faces[4][7] = _this.faces[face][3];
                    _this.faces[4][4] = _this.faces[face][4];
                    _this.faces[4][1] = _this.faces[face][5];

                    _this.faces[5][7] = _this.faces[face][6];
                    _this.faces[5][4] = _this.faces[face][7];
                    _this.faces[5][1] = _this.faces[face][8];
                    break;

                case 8:
                    _this.faces[0][0] = _this.faces[face][0];
                    _this.faces[0][3] = _this.faces[face][3];
                    _this.faces[0][6] = _this.faces[face][6];

                    _this.faces[1][0] = _this.faces[face][1];
                    _this.faces[1][3] = _this.faces[face][4];
                    _this.faces[1][6] = _this.faces[face][7];

                    _this.faces[2][0] = _this.faces[face][2];
                    _this.faces[2][3] = _this.faces[face][5];
                    _this.faces[2][6] = _this.faces[face][8];

                    _this.faces[3][6] = _this.faces[face][0];
                    _this.faces[3][3] = _this.faces[face][1];
                    _this.faces[3][0] = _this.faces[face][2];

                    _this.faces[4][6] = _this.faces[face][3];
                    _this.faces[4][3] = _this.faces[face][4];
                    _this.faces[4][0] = _this.faces[face][5];

                    _this.faces[5][6] = _this.faces[face][6];
                    _this.faces[5][3] = _this.faces[face][7];
                    _this.faces[5][0] = _this.faces[face][8];
                    break;

            }
        }

    }

    zoom(delta) {
        this.setCameraView(-delta, 0, 0);
        this.draw();
    }

    moveCameraView(x, y) {
        this.setCameraView(0, -y * 0.01, -x * 0.01);
        this.draw();
    }


    setCameraView(d, horizontal, vertical) {
        // view port config
        mat4.translate(this.cameraViewMatrix,     // destination matrix
            this.cameraViewMatrix,     // matrix to translate
            [0.0, 0.0, -this.dist]);  // amount to translate
    
        let cameraViewMatrix = mat4.create();
        mat4.rotate(this.cameraViewMatrix, this.cameraViewMatrix, horizontal, [0, 1, 0]);
        mat4.rotate(this.cameraViewMatrix, this.cameraViewMatrix, vertical, [1, 0, 0]);

        this.dist +=d;
        mat4.translate(this.cameraViewMatrix,     // destination matrix
            this.cameraViewMatrix,     // matrix to translate
            [0.0, 0.0, this.dist]);  // amount to translate

        
        
        mat4.invert(this.modelViewMatrix, this.cameraViewMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, this.modelViewMatrix);
    }

    /**
     * Draw the Rb cube
     */
    draw() {
        this.gl.clearColor(0.7, 0.7, 0.7, 1);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < this.cubes.length; i++) {
            {// vertext buffer
                const numComponents = 3;    // 3d coordinate
                const type = this.gl.FLOAT;      // the data in the buffer is 32bit floats
                const normalize = false;    // don't normalize
                const stride = 0;           // how many bytes to get from one set of values to the next
                // 0 = use type and numComponents above
                const offset = 0;           // how many bytes inside the buffer to start from
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.position);
                this.gl.vertexAttribPointer(
                    this.programInfo.attribLocations.vertexPosition,
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);

                this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
            }

            {
                const numComponents = 4;
                const type = this.gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.color);
                this.gl.vertexAttribPointer(
                    this.programInfo.attribLocations.vertexColor,
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);
                this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
            }


            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.transformMatrix, false, this.cubes[i].transformMatrix);
            this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
        }
    }


}