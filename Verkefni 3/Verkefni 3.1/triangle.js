///////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Einfaldasta WebGL forritið.  Teiknar einn rauðan þríhyrning.
//
//    Hjálmtýr Hafsteinsson, ágúst 2023
///////////////////////////////////////////////////////////////////
var gl;
var points;
var time;
var initTime;
var color;
var counter = 0;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    color = gl.getUniformLocation( program, "color" );
    time = gl.getUniformLocation( program, "time");
    initTime = Date.now();

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    var msek = Date.now() - initTime;
    if(msek > 1000){
        initTime = Date.now();
        if(counter == 0){
            var col = vec4( 1, 0, 0, 1);
            counter++;
        }
        else if(counter == 1){
            var col = vec4( 0, 1, 0, 1);
            counter++;
        }
        else if(counter == 2){
            var col = vec4( 0, 0, 1, 1);
            counter = 0;
        }
        gl.uniform4fv( color, flatten(col) );
    }
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    window.requestAnimationFrame(render);
}
