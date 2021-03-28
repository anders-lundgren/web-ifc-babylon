import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders/glTF";
import * as IFCLOADER from "./IfcLoader";
import sampleIfc from './test.ifc';

class App {

    private mesh;
    public async createContent() {

        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // Load the 3D engine
        var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        // CreateScene function that creates and return the scene
        var createScene = function () {
            // Create a basic BJS Scene object
            var scene = new BABYLON.Scene(engine);
            // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
            var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
            // Target the camera to scene origin
            camera.setTarget(BABYLON.Vector3.Zero());
            // Attach the camera to the canvas
            camera.attachControl(canvas, false);

            //Controls  WASD
            camera.keysUp.push(87);
            camera.keysDown.push(83);
            camera.keysRight.push(68);
            camera.keysLeft.push(65);

            // // Create a light and aim it vertically to the sky (0, 1, 0).
            // let light = new BABYLON.HemisphericLight('light-1', new BABYLON.Vector3(0, 1, 0), scene);
            // // Create another light and aim it vertically to the ground (0, -1, 0).
            // let downlight = new BABYLON.HemisphericLight('light-2', new BABYLON.Vector3(0, -1, 0), scene);
            // // Set light intensity to a lower value (default is 1).
            // light.intensity = 0.9;
            // downlight.intensity = 0.8;

            // Return the created scene
            return scene;
        }
        // call the createScene function
        var scene = createScene();

        // Create a default environment for the scene.
        const env = scene.createDefaultEnvironment({
            createSkybox: false
        });

        // here we add XR support
        if (env != null) {
            const xrHelper = scene.createDefaultXRExperienceAsync({
                // floorMeshes: [<BABYLON.AbstractMesh>env.ground],
                disableDefaultUI: false
            })
        }
        else {
            console.log('WebXR environment is unavailable');
        }

        var filesInput = new BABYLON.FilesInput(engine, scene, null, null, null, null, function () {
            BABYLON.Tools.ClearLogCache()
        }, null, null);

        // let divFps = document.getElementById("fps");
        // GUI
        var plane = BABYLON.MeshBuilder.CreatePlane("plane", {size: 2});
        plane.position.z = -1;
        plane.position.y = 2;
        plane.position.x = 2;

        var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);

        var text1 = new GUI.TextBlock;
        text1.width = 1;
        text1.height = 0.4;
        text1.color = "white";
        text1.fontSize = 120;
        text1.fontWeight = "bold";
        text1.text = "0 fps";
        // text1.transformCenterX = 10;
        // text1.horizontalAlignment = 10;
        // text1.verticalAlignment= -100;
        // text1._moveToProjectedPosition(new BABYLON.Vector3(0,1,1));
        advancedTexture.addControl(text1);
        // text1.linkOffsetY = 1;

        // run the render loop
        engine.runRenderLoop(function () {
            scene.render();
            // divFps.innerHTML = engine.getFps().toFixed() + " fps";
            text1.text = engine.getFps().toFixed() + " fps";
        });

        // Initialize IFC loader
        var ifc = new IFCLOADER.IfcLoader();
        await ifc.initialize();

        // Set up drag and drop for loading files
        filesInput.onProcessFileCallback = (file: File, name, extension) => {
            console.log("Reading file: " + name);
            file.text().then(buf => {
                // delete existing objects
                try {
                    this.mesh.dispose();
                }
                catch {
                    //
                }
                this.mesh = ifc.load(name, buf, scene, true).then(() => {
                    console.log("Done processing file: " + name);
                }
                );
            });
            return true;
        };

        filesInput.monitorElementForDragNDrop(canvas);

        // add the canvas/window resize event handler
        window.addEventListener('resize', function () {
            engine.resize();
        });
        var buffer:string = sampleIfc;
        this.mesh = await ifc.load("Sample model", buffer, scene, true);
    }
}
var app = new App();
app.createContent();