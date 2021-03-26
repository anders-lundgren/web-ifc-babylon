# web-ifc-babylon

This library is the implementation of [web-ifc](https://github.com/tomvandig/web-ifc) for [Babylon.js](https://www.babylonjs.com/). This allows to parse and generate the geometry of IFC models in JavaScript in the browser. 

## Content

this project consists of the following folders:

- **src**: contains the implementation of the IfcLoader for Babylon.js. It is written in Typescript.  

It should be noted that the web-ifc .WASM file will be required. This file cannot be included in the general build and has to be in a specific directory (see examples). The correct functioning of this library with compressors like uglify or terser is not yet guaranteed.

This library mirrors the functionality of [web-ifc-three](https://github.com/tomvandig/web-ifc-three) - a THREE.js library for viewing IFC models using web-ifc. 

The test file included in the project is the Duplex Apartment Model from [Open IFC Model Repository](http://openifcmodel.cs.auckland.ac.nz/Model/Details/274) with a cc-by-sa-3.0 license. 