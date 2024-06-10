import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

var camera, scene, renderer;

var geometry, material, mesh;

var garra = new THREE.Object3D(), grua = new THREE.Object3D(), cable, conjunto_carrinho, topo_grua, base_grua = new THREE.Object3D(), finger_1, finger_2, finger_3, finger_4;

var contentor = new THREE.Object3D();
var cargas = [];
var cargaMover = new THREE.Object3D;

var cameraFrontal, cameraLateral, cameraTopo, cameraFixaOrtogonal, cameraFixaPerspectiva, cameraMovelPerspectiva;

var boundingBoxGarra, boundingBoxes = [];

var cabineDireita = false, cabineEsquerda = false, carrinhoIn = false, carrinhoOut = false, 
    garraAbre, garraFecha = false, garraDesce = false, garraSobe = false, colisao = false;

var activeKeys = [], activeKeysCamera = [], currentCamera = '5';

var materials = [];

function createTetrahedron(obj, vertices, x, y, z, tetrahedron_material){

    var indices = [ 0,  1,  2,   0,  2,  3,    0,  3,  1,    1,  3,  2];
    geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);
    mesh = new THREE.Mesh(geometry, tetrahedron_material);
    mesh.position.set(x, y, z);
    obj.add(mesh)
    
}

function add_finger(obj, x, y, z, finger) {
    var cub;
    var finger_cube_material = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(finger_cube_material);
    cub = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), finger_cube_material);
    var vertices = [
        new THREE.Vector3(0, -2, 0),
        new THREE.Vector3(0.5, 0, 0),
        new THREE.Vector3(0, 0, 0.5),
        new THREE.Vector3(-0.5, 0, -0.5)
    ];
    var finger_claw_material = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(finger_claw_material);
    createTetrahedron(finger, vertices, 0, -0.5, 0, finger_claw_material);
    finger.add(cub);
    finger.position.set(x, y, z);
    obj.add(finger);

}

function createGarra() {
    'use strict';
    var big_cube;
    var big_cube_material = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(big_cube_material);
    big_cube = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), big_cube_material);
    big_cube.position.set(0,0,0);
    garra.add(big_cube);
    finger_1 = new THREE.Object3D();
    finger_2 = new THREE.Object3D();
    finger_3 = new THREE.Object3D();
    finger_4 = new THREE.Object3D();
    add_finger(garra, 2, -3, 2, finger_1);
    add_finger(garra, -2, -3, 2, finger_2);
    add_finger(garra, 2, -3, -2, finger_3);
    add_finger(garra, -2, -3, -2, finger_4);
    cameraMovelPerspectiva = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    // Posicionar a câmera móvel no gancho da grua (supondo que o garra está em (0, 0, 0))
    cameraMovelPerspectiva.position.set(0, -2.5 , 0); 
    cameraMovelPerspectiva.lookAt(0,cameraMovelPerspectiva.position.y - 1,0); // Apontar para baixo
    garra.position.set(0, -18.5, 10);
    garra.add(cameraMovelPerspectiva);
    const box = new THREE.Box3();

    boundingBoxGarra = new THREE.Box3().setFromObject(garra);

    scene.add(garra);
}

function createConjuntoCarrinho() {
    var cable_material = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
    materials.push(cable_material);
    var carrinho_material = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
    materials.push(carrinho_material);
    cable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 10, 32), cable_material);
    cable.position.set(0, -11, 10);
    var carrinho = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 20), carrinho_material);
    carrinho.position.set(0, -3.5, 10);
    conjunto_carrinho = new THREE.Object3D();
    conjunto_carrinho.add(carrinho);
    conjunto_carrinho.add(cable);
    conjunto_carrinho.add(garra);
    conjunto_carrinho.position.z = 10;
}

function createTirant(obj, radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, rotation, x, y, z){

    // Create geometry for the cylinder
    var material_tirant = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
    geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);

    // Create the cylinder mesh
    var tirant = new THREE.Mesh(geometry, material_tirant);
    tirant.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotation);
    tirant.position.set(x, y, z);
    obj.add(tirant);
}

function createTopoGrua() {
    var material_traçao_do_carrinho = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(material_traçao_do_carrinho);
    var material_lança = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(material_lança);
    var material_contra_lança = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(material_contra_lança);
    var material_contra_peso = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(material_contra_peso);
    var material_cabinete = new THREE.MeshBasicMaterial({ color: 0xff9900, wireframe: true });
    materials.push(material_cabinete);
    var traçao_do_carrinho = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 90), material_traçao_do_carrinho);
    traçao_do_carrinho.position.set(0, 1.5, 35);
    var lança = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 60), material_lança);
    lança.position.set(0, 9, 45);
    var contra_lança = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 40), material_contra_lança);
    contra_lança.position.set(0, 1.5, -30);
    var contra_peso = new THREE.Mesh(new THREE.BoxGeometry(20, 9, 30), material_contra_peso);
    contra_peso.position.set(0, -5.5, -30);
    var cabinete = new THREE.Mesh(new THREE.BoxGeometry(20, 9, 20), material_cabinete);
    cabinete.position.set(0, -5.5, 0);

    topo_grua = new THREE.Object3D();
    topo_grua.add(traçao_do_carrinho);
    topo_grua.add(lança);
    topo_grua.add(contra_lança);
    topo_grua.add(contra_peso);
    topo_grua.add(cabinete);
    var vertices = [
        new THREE.Vector3(0, 40, -10),
        new THREE.Vector3(-10, 0, -10),
        new THREE.Vector3(10, 0, -10),
        new THREE.Vector3(0, 0, 10)
    ];
    var porta_lança_material = new THREE.MeshBasicMaterial({ color: 0xff9900, wireframe: true });
    materials.push(porta_lança_material);
    createTetrahedron(topo_grua, vertices, 0, 4, 0, porta_lança_material);
    createTirant(topo_grua, 0.5, 0.5, 56, 32, 32, false, -Math.PI/2.9, 0, 27, 17);
    createTirant(topo_grua, 0.5, 0.5, 42.5, 32, 32, false, Math.PI/6, 0, 22.5, -21);
    topo_grua.add(conjunto_carrinho)
    topo_grua.position.set(0, 85, 0);
    scene.add(topo_grua);
}

function createBaseGrua() {
    var base_material = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true });
    materials.push(base_material);
    var suporte_material = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    materials.push(suporte_material);
    var base = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 30), base_material);
    base.position.set(0, 5, 0);
    var suporte = new THREE.Mesh(new THREE.BoxGeometry(20, 65, 20), suporte_material);
    suporte.position.set(0, 42.5, 0);
    base_grua.add(base);
    base_grua.add(suporte);
    scene.add(base_grua);

}

function createGrua() {
    createGarra();
    createConjuntoCarrinho();
    createTopoGrua();
    createBaseGrua();
    grua = new THREE.Object3D();
    grua.add(topo_grua);
    grua.add(base_grua);
    scene.add(grua);
}


function createCargas() {
    
    var contentorHalfWidth = 15; // Metade da largura do contentor
    var contentorHalfDepth = 15; // Metade da profundidade do contentor

    var minX = -67 + contentorHalfWidth; // limite inferior carrinho + metade da largura do contentor
    var maxX = 67 - contentorHalfWidth; // limite superior carrinho - metade da largura do contentor
    var minZ = -67 + contentorHalfDepth; // limite inferior carrinho + metade da profundidade do contentor
    var maxZ = 67 - contentorHalfDepth; // limite superior carrinho - metade da profundidade do contentor

    var boundingBoxBase = new THREE.Box3().setFromObject(base_grua);
    var boundingBoxContentor = new THREE.Box3().setFromObject(contentor);

    for (var i = 0; i < 10; i++) {
        var randomX, randomZ;

        // Garantir que as coordenadas não estejam dentro dos limites do contentor e da base da grua
        do {
            randomX = THREE.MathUtils.randFloat(minX, maxX);
            randomZ = THREE.MathUtils.randFloat(minZ, maxZ);
        } while ((randomX >= boundingBoxBase.min.x && randomX <= boundingBoxBase.max.x && randomZ >= boundingBoxBase.min.z && randomZ <= boundingBoxBase.max.z) || // Dentro da base da grua
                 (randomX >= boundingBoxContentor.min.x && randomX <= boundingBoxContentor.max.x && // Dentro do contentor
                  randomZ >= boundingBoxContentor.min.z && randomZ <= boundingBoxContentor.max.z));

        var cargaGeometry;
        var cargaMaterial;
        var carga;
        var size;

        // Criar 2 cargas de cada tipo
        switch (i) {
            case 0:
            case 1:
                size = THREE.MathUtils.randFloat(2, 5); // Tamanho aleatório para dodecaedro
                cargaGeometry = new THREE.DodecahedronGeometry(size, 1);
                cargaMaterial = new THREE.MeshBasicMaterial({ color: 0x339933, wireframe: true });
                break;
            case 2:
            case 3:
                size = THREE.MathUtils.randFloat(2, 5); // Tamanho aleatório para icosaedro
                cargaGeometry = new THREE.IcosahedronGeometry(size, 0);
                cargaMaterial = new THREE.MeshBasicMaterial({ color: 0xff5555, wireframe: true });
                break;
            case 4:
            case 5:
                size = THREE.MathUtils.randFloat(1, 3); // Tamanho aleatório para torus knot
                cargaGeometry = new THREE.TorusKnotGeometry(size, 0.4, 100, 2);
                cargaMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300, wireframe: true });
                break;
            case 6:
            case 7:
                size = THREE.MathUtils.randFloat(1, 3); // Tamanho aleatório para torus knot
                cargaGeometry = new THREE.TorusGeometry(size, 1, 12, 48);
                cargaMaterial = new THREE.MeshBasicMaterial( { color: 0x336699, wireframe: true } );
                break;
            case 8:
            case 9:
                size = THREE.MathUtils.randFloat(1, 4); // Tamanho aleatório para cubo
                cargaGeometry = new THREE.BoxGeometry(size,size,size);
                cargaMaterial = new THREE.MeshBasicMaterial( { color: 0xcc00cc, wireframe: true } );
                break;
        }

        carga = new THREE.Mesh(cargaGeometry, cargaMaterial);

        var boundingBoxCarga = new THREE.Box3().setFromObject(carga);

        var height = boundingBoxCarga.max.y - boundingBoxCarga.min.y;

        carga.position.set(randomX, height/2, randomZ);
        carga.userData = { movingUp: false, movingForward: false, movingDown: false, movingLeft: false, movingBackUp: false, movingBackwards: false, movingRight: false };
        scene.add(carga);
        cargas.push(carga);

        boundingBoxes.push(boundingBoxCarga);
    }
    
}

function createContentor() {

    var material_contentor = new THREE.MeshBasicMaterial({ color: 0x003366, wireframe: true });
    materials.push(material_contentor);
    var material_contentor_bottom = new THREE.MeshBasicMaterial({ color: 0x006699, wireframe: true });
    materials.push(material_contentor_bottom);

    var plane1 = new THREE.Mesh(new THREE.PlaneGeometry(15, 30), material_contentor_bottom); 
    plane1.rotation.set(-Math.PI / 2, 0, 0); // Bottom
    plane1.position.set(0, -5, 0);

    var plane2 = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), material_contentor); 
    plane2.rotation.set(0, 0, 0); // Front
    plane2.position.set(0, 0, 15);

    var plane3 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), material_contentor); 
    plane3.rotation.set(0, Math.PI / 2, 0); // Left
    plane3.position.set(-7.5, 0, 0);

    var plane4 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), material_contentor); 
    plane4.rotation.set(0, Math.PI / 2, 0); // Right
    plane4.position.set(7.5, 0, 0);

    var plane5 = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), material_contentor); 
    plane5.rotation.set(0, 0, 0); // Front
    plane5.position.set(0, 0, -15);

   
    var contentorPosX = 45;
    var contentorPosY = 5;
    var contentorPosZ = 35;

    contentor.add(plane1);
    contentor.add(plane2);
    contentor.add(plane3);
    contentor.add(plane4);
    contentor.add(plane5);
    contentor.position.set(contentorPosX, contentorPosY, contentorPosZ);
    scene.add(contentor);
}

/////////////////
/* CREATE SCENE*/
/////////////////

function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));
    scene.background = new THREE.Color(0xffffff);

    //createTable(0,0,0);
    createGrua();
    createContentor();
    createCargas();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {
    'use strict';

    const aspectRatio = window.innerWidth / window.innerHeight;
    const viewHeight = 160;
    const viewWidth = viewHeight * aspectRatio;
    
    cameraFrontal = new THREE.OrthographicCamera(-viewWidth/2, viewWidth/2, viewHeight/2, -viewHeight/2, 0.1, 2000);
    cameraFrontal.position.x = 0;
    cameraFrontal.position.y = 50;
    cameraFrontal.position.z = 80;
    cameraFrontal.lookAt(new THREE.Vector3(0, 50, 0));
    scene.add(cameraFrontal);

    cameraLateral = new THREE.OrthographicCamera(-viewWidth/2, viewWidth/2, viewHeight/2, -viewHeight/2, 0.1, 2000);
    cameraLateral.position.x = 80;
    cameraLateral.position.y = 50;
    cameraLateral.position.z = 0;
    cameraLateral.lookAt(new THREE.Vector3(0, 50, 0));
    scene.add(cameraLateral);

    cameraTopo = new THREE.OrthographicCamera(-viewWidth/2, viewWidth/2, viewHeight/2, -viewHeight/2, 0.1, 2000);
    cameraTopo.position.x = 0;
    cameraTopo.position.y = 170;
    cameraTopo.position.z = 0;
    cameraTopo.lookAt(scene.position);
    scene.add(cameraTopo);
    cameraFixaOrtogonal = new THREE.OrthographicCamera(-viewWidth/2, viewWidth/2, viewHeight/2, -viewHeight/2, 0.1, 2000);
    cameraFixaOrtogonal.position.x = 170;
    cameraFixaOrtogonal.position.y = 170;
    cameraFixaOrtogonal.position.z = 170;    
    cameraFixaOrtogonal.lookAt(new THREE.Vector3(0, 50, 0));
    scene.add(cameraFixaOrtogonal);

    cameraFixaPerspectiva = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    cameraFixaPerspectiva.position.x = cameraFixaOrtogonal.position.x;
    cameraFixaPerspectiva.position.y = cameraFixaOrtogonal.position.y;
    cameraFixaPerspectiva.position.z = cameraFixaOrtogonal.position.z;    
    cameraFixaPerspectiva.lookAt(scene.position);
    scene.add(cameraFixaPerspectiva);


    camera = cameraFixaPerspectiva;
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';
    if (colisao){return;}
    boundingBoxGarra.setFromObject(garra);
    for (var i = 0; i < cargas.length; i++) {
        boundingBoxes[i].setFromObject(cargas[i]);

        if (boundingBoxGarra.intersectsBox(boundingBoxes[i])) {
            colisao = true;
            
            
            garra.add(cargas[i]);
            garraFecha = true;
            var cargaPosicaoRelativa = new THREE.Vector3();
            garra.getWorldPosition(cargaPosicaoRelativa);
            var worldPosition = garra.worldToLocal(cargaPosicaoRelativa);
            worldPosition.y -= 5;
            
            cargas[i].position.set(worldPosition.x, worldPosition.y, worldPosition.z);
            cargaMover=cargas[i];
            cargaMover.userData.movingUp = true;
            break;
        }
    }
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';
            
    if (cargaMover.userData.movingUp == true || cargaMover.userData.movingBackUp == true ) {
        garraSobe = true;
        if (garra.position.y > -60) {
            garraSobe = false;
            if (cargaMover.userData.movingUp == true){
                cargaMover.userData.movingUp = false;
                
                var garraWorldPosition = new THREE.Vector3();
                garra.getWorldPosition(garraWorldPosition);
                
                var contentorWorldPosition = new THREE.Vector3();
                contentor.getWorldPosition(contentorWorldPosition);

                var distanciaGruaContentor = contentorWorldPosition.distanceTo(new THREE.Vector3(0, 0, 0));
                var distanceToOrigin = garraWorldPosition.distanceTo(new THREE.Vector3(0, garraWorldPosition.y, 0));

                if (distanciaGruaContentor < distanceToOrigin) {
                    cargaMover.userData.movingBackwards = true;
                } else {
                    cargaMover.userData.movingForward = true;
                }
            } else {
                cargaMover.userData.movingBackUp = false; 
                garraAbre = false;
                colisao = false;
            }
        }
    }
    if (cargaMover.userData.movingForward == true) {
        carrinhoOut = true;
        var garraWorldPosition = new THREE.Vector3();
        garra.getWorldPosition(garraWorldPosition);
        var contentorWorldPosition = new THREE.Vector3();
        contentor.getWorldPosition(contentorWorldPosition);
        var distanciaGruaContentor = contentorWorldPosition.distanceTo(new THREE.Vector3(0, 0, 0));

        var distanceToOrigin = garraWorldPosition.distanceTo(new THREE.Vector3(0, garraWorldPosition.y, 0));

        if (distanciaGruaContentor <= distanceToOrigin + 1 && distanciaGruaContentor >= distanceToOrigin -1) {
            carrinhoOut = false;
            cargaMover.userData.movingForward = false;
            if (garraWorldPosition.z < 0) {
                cargaMover.userData.movingLeft = true;
            } else {
                cargaMover.userData.movingRight = true;
            }
        }
    }
    if (cargaMover.userData.movingBackwards == true) {
        carrinhoIn = true;
        var garraWorldPosition = new THREE.Vector3();
        garra.getWorldPosition(garraWorldPosition);
        var contentorWorldPosition = new THREE.Vector3();
        contentor.getWorldPosition(contentorWorldPosition);
        var distanciaGruaContentor = contentorWorldPosition.distanceTo(new THREE.Vector3(0, 0, 0));

        var distanceToOrigin = garraWorldPosition.distanceTo(new THREE.Vector3(0, garraWorldPosition.y, 0));

        if (distanciaGruaContentor <= distanceToOrigin + 1 && distanciaGruaContentor >= distanceToOrigin -1) {
            carrinhoIn = false;
            cargaMover.userData.movingBackwards = false;
            if (garraWorldPosition.z < 0) {
                cargaMover.userData.movingLeft = true;
            } else {
                cargaMover.userData.movingRight = true;
            }
        }
    }
    if (cargaMover.userData.movingLeft == true) {
        cabineEsquerda = true;
        var contentorPosition = new THREE.Vector3();
        contentor.getWorldPosition(contentorPosition);

        var worldPosition = new THREE.Vector3();
        garra.getWorldPosition(worldPosition);

        var distance = worldPosition.distanceTo(contentorPosition);

        if (distance < 21 ) {

            cabineEsquerda = false;
            cargaMover.userData.movingLeft = false;
            cargaMover.userData.movingDown = true;
        }
    }
    if (cargaMover.userData.movingRight == true) {
        cabineDireita = true;
        var contentorPosition = new THREE.Vector3();
        contentor.getWorldPosition(contentorPosition);

        var worldPosition = new THREE.Vector3();
        garra.getWorldPosition(worldPosition);

        var distance = worldPosition.distanceTo(contentorPosition);

        if (distance < 21 ) {

            cabineDireita = false;
            cargaMover.userData.movingRight = false;
            cargaMover.userData.movingDown = true;
        }
    }
    if (cargaMover.userData.movingDown == true) { 
        garraDesce = true;
        if (garra.position.y < -70) {
            garraDesce = false;
            cargaMover.userData.movingDown = false;
            garraFecha = false;
            garraAbre = true;
            garra.remove(cargaMover);
            cargaMover.userData.movingBackUp = true;
        }
    }
}


////////////
/* UPDATE */
////////////
function update(){
    'use strict';
    if(carrinhoOut){
        if (conjunto_carrinho.position.z < 58) { // carrinho não passa dos limites
            var translationVector = new THREE.Vector3(0, 0, 0.5);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), conjunto_carrinho.rotation.y);
            conjunto_carrinho.position.add(translationVector);
        }
        if (colisao){
            carrinhoOut = false;
        }
    }

    if (carrinhoIn){
        if (conjunto_carrinho.position.z > 10) { 
            var translationVector = new THREE.Vector3(0, 0, -0.5);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), conjunto_carrinho.rotation.y);
            conjunto_carrinho.position.add(translationVector);
        }
        if (colisao){
            carrinhoIn = false;
        }
    }
    if (cabineDireita){
        topo_grua.rotation.y += 0.02*Math.PI;
    }
    if (cabineEsquerda) {
        topo_grua.rotation.y -= 0.02*Math.PI;
        if (colisao){
            cabineEsquerda = false;
        }
    }
    if (garraDesce) {
        var garraPosicaoRelativa = new THREE.Vector3();
        garra.getWorldPosition(garraPosicaoRelativa);
        base_grua.worldToLocal(garraPosicaoRelativa);
        if(garraPosicaoRelativa.y > 5) { 
            var translationVector = new THREE.Vector3(0, -0.5, 0);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), garra.rotation.y);
            garra.position.add(translationVector);
            cable.scale.y += 0.05;
            translationVector = new THREE.Vector3(0, -0.25, 0);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), cable.rotation.y);
            cable.position.add(translationVector);
        }
    }
    if (garraSobe) {
        var garraPosicaoRelativa = new THREE.Vector3();
        garra.getWorldPosition(garraPosicaoRelativa);
        base_grua.worldToLocal(garraPosicaoRelativa);
        if (garraPosicaoRelativa.y < 75) { 
            var translationVector = new THREE.Vector3(0, 0.5, 0);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), garra.rotation.y);
            garra.position.add(translationVector);
            cable.scale.y -= 0.05; 
            translationVector = new THREE.Vector3(0, 0.25, 0);
            translationVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), cable.rotation.y);
            cable.position.add(translationVector);
        }
        if (colisao){
            garraSobe = false;
        }
    }

    if (garraAbre) {

        if(finger_1.children[0].position.y < -0.501) {
            moveFinger(finger_1, new THREE.Vector3(2, -3, 0.2), new THREE.Vector3(3, -3, 0.2), 0.1); 
        }

        if(finger_2.children[0].position.y > -0.499) {
            moveFinger(finger_2, new THREE.Vector3(-2, -3, 0.2), new THREE.Vector3(-3, -3, 0.2), 0.1);     
        }

        if(finger_3.children[0].position.y < -0.501) {
            moveFinger(finger_3, new THREE.Vector3(2, -3, 0.2), new THREE.Vector3(3, -3, 0.2), 0.1); 
        }
        
        if(finger_4.children[0].position.y > -0.499) {
            moveFinger(finger_4, new THREE.Vector3(-2, -3, 0.2), new THREE.Vector3(-3, -3, 0.2), 0.1);
        }

    } 
    
    if (garraFecha) {
        if(finger_1.children[0].position.y > -0.505) {
            moveFinger(finger_1, new THREE.Vector3(-2, -3, 0.2), new THREE.Vector3(-3, -3, 0.2), 0.1); 
        }

        if(finger_2.children[0].position.y < -0.496) {
            moveFinger(finger_2, new THREE.Vector3(2, -3, 0.2), new THREE.Vector3(3, -3, 0.2), 0.1);     
        }

        if(finger_3.children[0].position.y > -0.505) {
            moveFinger(finger_3, new THREE.Vector3(-2, -3, 0.2), new THREE.Vector3(-3, -3, 0.2), 0.1); 
        }
        
        if(finger_4.children[0].position.y < -0.496) {
            moveFinger(finger_4, new THREE.Vector3(2, -3, 0.2), new THREE.Vector3(3, -3, 0.2), 0.1);
        }
    }  
    
    // Função para mover um dedo da garra para uma nova posição
    function moveFinger(finger, currentPosition, targetPosition, speed) {
        if (finger.children[0].position.z < 58) { 
            var direction = targetPosition.clone().sub(currentPosition).normalize();
            var angle = currentPosition.angleTo(targetPosition);
            var axis = new THREE.Vector3(0, 0, 1);
            
            direction.applyAxisAngle(axis, angle * speed);
            var displacement = direction.clone().multiplyScalar(speed);
            finger.children[0].position.add(displacement);
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(currentPosition.normalize(), targetPosition.normalize());
            finger.children[0].applyQuaternion(quaternion);
        
        }
    }
    checkCollisions();
    if (colisao){
        handleCollisions();
    
    }

}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, camera);
}


////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCameras();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate(){
    'use strict';
    render();

    requestAnimationFrame(animate);
    update();

    updateHUDKeysText(activeKeys);
    renderer.render(scene, camera);
    renderer.autoClear = false;
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (innerHeight > 0 && innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(event) {
    switch (event.keyCode) {

        case 55: // Tecla '7' - Wireframe
            materials.forEach(function (material) {
                material.wireframe = !material.wireframe;
            });
            if (!activeKeys.includes('7')){
                activeKeys.push('7');
            } else {
                activeKeys.splice(activeKeys.indexOf('7'), 1);
            }
            break;

        case 65: //A
        case 97: //a
            if(!colisao) {
                if (!activeKeys.includes('A')){
                    activeKeys.push('A');
                }
                cabineEsquerda = true;
            }
            break;

        case 81: //Q
        case 113: //q
            if(!colisao) {
                if (!activeKeys.includes('Q')){
                    activeKeys.push('Q');
                }
                cabineDireita = true;
            }
            break;

        case 87: //w
        case 119: //W
            if(!colisao) {
                if (!activeKeys.includes('W')){
                    activeKeys.push('W');
                }
                carrinhoOut = true;
            }
            break;

        case 83: //s
        case 115: //S
            if(!colisao) {
                if (!activeKeys.includes('S')){
                    activeKeys.push('S');
                }
                carrinhoIn = true;
            }
            break;

        case 49: // Tecla '1' - Câmera frontal
            renderer.render(scene, cameraFrontal);
            camera = cameraFrontal;
            currentCamera = '1';
            break;
        case 50: // Tecla '2' - Câmera lateral
            renderer.render(scene, cameraLateral);
            camera = cameraLateral;
            currentCamera = '2';
            break;
        case 51: // Tecla '3' - Câmera topo
            renderer.render(scene, cameraTopo);
            camera = cameraTopo;
            currentCamera = '3';
            break;
        case 52: // Tecla '4' - Câmera fixa ortogonal
            renderer.render(scene, cameraFixaOrtogonal);
            camera = cameraFixaOrtogonal;
            currentCamera = '4';
            break;
        case 53: // Tecla '5' - Câmera fixa perspectiva
            renderer.render(scene, cameraFixaPerspectiva);
            camera = cameraFixaPerspectiva;
            currentCamera = '5';
            break;
        case 54: // Tecla '6' - Câmera móvel perspectiva
            renderer.render(scene, cameraMovelPerspectiva);
            camera = cameraMovelPerspectiva;
            currentCamera = '6';
            break;
        case 69: //E
        case 101: //e
            if(!colisao) {
                if (!activeKeys.includes('E')){
                    activeKeys.push('E');
                }
                garraDesce = true;
            }
            break;

        case 68: //D
        case 100: //d
            if(!colisao) {
                if (!activeKeys.includes('D')){
                    activeKeys.push('D');
                }
                garraSobe = true;
            }
            break;

        case 82: //R
        case 114: //r
            if(!colisao) {
                if (!activeKeys.includes('R')){
                    activeKeys.push('R');
                }
                garraAbre = true;
            }
            break;

        case 70: //F
        case 102: //f
            if(!colisao){
                if (!activeKeys.includes('F')){
                    activeKeys.push('F');
                }
                garraFecha = true;
            }
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
    switch (e.keyCode) {

        case 65: //A
        case 97: //a
            activeKeys.splice(activeKeys.indexOf('A'), 1);
            cabineEsquerda = false;
            break;

        case 81: //Q
        case 113: //q
            activeKeys.splice(activeKeys.indexOf('Q'), 1);
            cabineDireita = false;
            break;

        case 87: //w
        case 119: //W
            activeKeys.splice(activeKeys.indexOf('W'), 1);
            carrinhoOut = false;
            break;

        case 83: //s
        case 115: //S
            activeKeys.splice(activeKeys.indexOf('S'), 1);
            carrinhoIn = false;
            break;

        case 69: //E
        case 101: //e
            activeKeys.splice(activeKeys.indexOf('E'), 1);
            garraDesce = false;
            break;

        case 68: //D
        case 100: //d
            activeKeys.splice(activeKeys.indexOf('D'), 1);
            garraSobe = false;
            break;
        
        case 82: //R
        case 114: //r
            activeKeys.splice(activeKeys.indexOf('R'), 1);
            garraAbre = false;
            break;

        case 70: //F
        case 102: //f
            activeKeys.splice(activeKeys.indexOf('F'), 1);
            garraFecha = false;
            break;
        
    }

}


///////////
/* HUD */
///////////
var hudElements = [];

function addHUDElement(element) {
    hudElements.push(element);
    updateHUD();
}

function updateHUD() {
    hudElements.forEach(function(element, index) {
        element.style.position = 'absolute';
        element.style.top = 20 + index * 30 + 'px';
        element.style.left = '20px';
        document.body.appendChild(element);
    });
}

var hudKeysText = document.createElement('div');
hudKeysText.textContent = 'Teclas ativas: Nenhuma';
addHUDElement(hudKeysText);

var hudCameraText = document.createElement('div');
hudCameraText.textContent = 'Câmera ativa: ' + currentCamera;
addHUDElement(hudCameraText);

function updateHUDKeysText(activeKeys) {
    hudKeysText.textContent = 'Teclas ativas: ' + activeKeys.join(', ');
    hudCameraText.textContent = 'Câmera ativa: ' + currentCamera;
}


init();

animate();
