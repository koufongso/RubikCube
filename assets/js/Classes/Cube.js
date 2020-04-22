class Cube {
    constructor(gl, x, y, z) {
        this.gl = gl;
        if (!x) x = 0;
        if (!y) y = 0;
        if (!z) z = 0;
        this.vertexPosition = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0,
        ];

        for (let i = 0; i < this.vertexPosition.length; i += 3) {
            this.vertexPosition[i] += x;
            this.vertexPosition[i + 1] += y;
            this.vertexPosition[i + 2] += z;
        }

        this.setBuffer();
        this.transformMatrix = mat4.create(); // for animation purpose
    }

    /**
     * update the buffer data
     */
    setBuffer() {
        let data = {
            positions: this.vertexPosition,
            indices: indices,
            colors: [
                [0.953, 0.953, 0.953, 1.0],    // Front face: white
                [0.91, 0.62, 0.08, 1.0],    // Back face: orange
                [0.0, 0.62, 0.33, 1.0],    // Top face: green
                [0.24, 0.5, 0.96, 1.0],    // Bottom face: blue
                [0.95, 0.95, 0.08, 1.0],    // Right face: yellow
                [0.93, 0.19, 0.19, 1.0],    // Left face: red
            ]
        }
        this.buffers = setBuffer(this.gl, data);
    }

    /**
     * update this cube's vertex coordinate
     * @param {*} transformMatrix 
     */
    updateVertexPose(transformMatrix) {
        for (let i = 0; i < this.vertexPosition.length; i += 3) {
            let v = vec4.fromValues(this.vertexPosition[i], this.vertexPosition[i + 1], this.vertexPosition[i + 2], 1);
            mat4.multiply(v, transformMatrix, v);
            this.vertexPosition[i] = v[0];
            this.vertexPosition[i + 1] = v[1];
            this.vertexPosition[i + 2] = v[2];
        }
    }
}