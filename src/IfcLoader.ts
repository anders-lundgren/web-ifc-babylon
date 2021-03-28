import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as WEBIFC from "web-ifc/web-ifc-api"
import { IndicesArray } from "babylonjs/types";
import { Matrix } from "babylonjs/Maths/math.vector";

export class IfcLoader {
    constructor() {

    }

    private ifcAPI = new WEBIFC.IfcAPI();

    private meshmaterials: Map<number, BABYLON.Mesh>;
    public loadedmeshes: number;

    async initialize() {
        await this.ifcAPI.Init();
    }

    async load(name, file, scene, mergematerials) {

        this.meshmaterials = new Map <number, BABYLON.Mesh>();

        var mToggle_YZ = [
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, 0, -1, 0,
            0, 0, 0, -1];

        var modelID = await this.ifcAPI.OpenModel(name, file);
        await this.ifcAPI.SetGeometryTransformation(modelID, mToggle_YZ);
        var flatMeshes = this.getFlatMeshes(modelID);

        scene.blockMaterialDirtyMechanism = true;
        scene.useGeometryIdsMap = true;
        scene.useMaterialMeshMap = true;
        
        var mainObject = new BABYLON.Mesh("custom", scene);

        for (var i = 0; i < flatMeshes.size(); i++) {
            var placedGeometries = flatMeshes.get(i).geometries;
            for (var j = 0; j < placedGeometries.size(); j++) {
                const mesh = this.getPlacedGeometry(modelID, placedGeometries.get(j), scene, mainObject, mergematerials)
            }
        }

        console.log("Materials: " + this.meshmaterials.size);
        console.log("Meshes: " + mainObject.getChildren().length);
        // scene.blockMaterialDirtyMechanism = false;
        
        return mainObject;
    }

    getFlatMeshes(modelID) {
        var flatMeshes = this.ifcAPI.LoadAllGeometry(modelID);
        return flatMeshes;
    }

    getPlacedGeometry(modelID, placedGeometry, scene, mainObject, mergematerials) {
        var meshgeometry = this.getBufferGeometry(modelID, placedGeometry, scene);
        if (meshgeometry != null) {
            var m = placedGeometry.flatTransformation;

            var matrix = new BABYLON.Matrix();
            matrix.setRowFromFloats(0, m[0], m[1], m[2], m[3]);
            matrix.setRowFromFloats(1, m[4], m[5], m[6], m[7]);
            matrix.setRowFromFloats(2, m[8], m[9], m[10], m[11]);
            matrix.setRowFromFloats(3, m[12], m[13], m[14], m[15]);

            // Some IFC files are not parsed correctly, leading to degenerated meshes
            try {
                meshgeometry.bakeTransformIntoVertices(matrix);
            }
            catch {
                console.warn("Unable to bake transform matrix into vertex array. Some elements may be in the wrong position.");
            }

            let color = placedGeometry.color;
            let colorid:number = Math.floor(color.x*256)+Math.floor(color.y*256**2)+Math.floor(color.z*256**3)+Math.floor(color.w*256**4);

            if (mergematerials && this.meshmaterials.has(colorid)) {
                var tempmesh: BABYLON.Mesh = this.meshmaterials.get(colorid);
                console.log("Adding new mesh: " + tempmesh.name);

                meshgeometry.material = tempmesh.material;
                var mergedmesh = BABYLON.Mesh.MergeMeshes([tempmesh, meshgeometry], true, true);
                // if (mergedmesh == null) {
                //     // Large mesh, allow 32 bit indices
                //     var mergedmesh = BABYLON.Mesh.MergeMeshes([tempmesh, meshgeometry], true, true);
                // }
                mergedmesh.name = colorid.toString(16);

                mergedmesh.material.freeze();
                mergedmesh.freezeWorldMatrix();

                this.meshmaterials.set(colorid, mergedmesh);
                mergedmesh.parent = mainObject;

            }
            else {
                var newMaterial = this.getMeshMaterial(color, scene)
                meshgeometry.material = newMaterial;

                meshgeometry.material.freeze();
                meshgeometry.freezeWorldMatrix();

                console.log("Adding new mesh material " + colorid.toString(16));
                this.meshmaterials.set(colorid, meshgeometry);
                meshgeometry.parent = mainObject;
            }        

            return meshgeometry;
        }
        else return null;
    }

     getBufferGeometry(modelID, placedGeometry, scene) {
        var geometry = this.ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID);
        if (geometry.GetVertexDataSize() !== 0) {
            var vertices = this.ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
            var indices = this.ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());

            var mesh = new BABYLON.Mesh("custom", scene);

            var vertexData = this.getVertexData(vertices, indices);
            vertexData.applyToMesh(mesh, false);

            return mesh;
        }
        else return null;
    }

    getVertexData(vertices: Float32Array, indices: IndicesArray) {
        var positions = new Array(Math.floor(vertices.length / 2));
        var normals = new Array(Math.floor(vertices.length / 2));
        for (var i = 0; i < vertices.length / 6; i++) {
            positions[i * 3 + 0] = vertices[i * 6 + 0] //* 0.001;            
            positions[i * 3 + 1] = vertices[i * 6 + 1] //* 0.001;            
            positions[i * 3 + 2] = vertices[i * 6 + 2] //* 0.001;            
            normals[i * 3 + 0] = vertices[i * 6 + 3] //* 0.001;            
            normals[i * 3 + 1] = vertices[i * 6 + 4] //* 0.001;            
            normals[i * 3 + 2] = vertices[i * 6 + 5] //* 0.001;            
        }
        var vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.indices = indices;

        return vertexData;
    }

    getMeshMaterial(color, scene) {
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        myMaterial.emissiveColor = new BABYLON.Color3(color.x, color.y, color.z);
        // if material has alpha - make it fully transparent for performance
        myMaterial.alpha = (color.w<1.0?0:1);
        myMaterial.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
        myMaterial.backFaceCulling = false;
        myMaterial.disableLighting = true;    

        return myMaterial;
    }
}