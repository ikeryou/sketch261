import { Composite } from "matter-js";
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Conf } from '../core/conf';
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { Mesh } from 'three/src/objects/Mesh';
import { Color } from 'three/src/math/Color';
import { Param } from "../core/param";
import { Vector3 } from 'three/src/math/Vector3';
import { BufferAttribute } from 'three/src/core/BufferAttribute';
import { Util } from "../libs/util";
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry';
import { TexLoader } from "../webgl/texLoader";


export class Visual extends Canvas {

  private _con: Object3D;
  private _img:Mesh;
  private _posBuffer:Array<number> = [];
  private _seg:Vector3 = new Vector3(Conf.instance.ITEM_NUM, Conf.instance.STACK_NUM, 0);

  constructor(opt: any) {
    super(opt);

    this._con = new Object3D()
    this.mainScene.add(this._con)

    // 画像
    this._img = new Mesh(
      new PlaneGeometry(1, 1, this._seg.x - 1, this._seg.y - 1),
      new MeshBasicMaterial({
        transparent:true,
        map:TexLoader.instance.get(Conf.instance.PATH_IMG + 'tex-sample.png'),
        // wireframe:true
      })
    )
    this._con.add(this._img);

    // positionを複製
    const arr = this._img.geometry.attributes.position.array
    const num =  arr.length
    for(let i = 0; i < num; i++) {
      this._posBuffer.push(arr[i]);
    }

    this._resize()
  }



  public updatePos(stack:Array<Composite>): void {
    // 物理演算結果をパーツに反映
    const offsetX = -this.renderSize.width * 0.5
    const offsetY = this.renderSize.height * 0.5

    // スケール
    const s = Math.abs(stack[0].bodies[0].position.x - stack[0].bodies[stack[0].bodies.length - 1].position.x) * 0.75
    this._img.scale.set(s, s, 1);

    const num = this._img.geometry.attributes.position.count
    const arr = new Float32Array(num * 3)

    stack.forEach((val,i) => {

      let basePos:Array<Vector3> = [];
      val.bodies.forEach((val2) => {
        const pos = val2.position;
        basePos.push(new Vector3(pos.x + offsetX, pos.y * -1 + offsetY, 0));
      });

      const start = i * this._seg.x;
      const end = start + this._seg.x;

      for(let l = start; l < end; l++) {
        const id = l * 3;
        const key = l % (this._seg.x)
        const x = Util.instance.map(basePos[key].x, -1, 1, -this.renderSize.width, this.renderSize.width) * 3;
        const y = Util.instance.map(basePos[key].y, -1, 1, -this.renderSize.height, this.renderSize.height) * 3;
        // const z = Util.instance.map(basePos[key].z, -1, 1, -this.renderSize.height, this.renderSize.height) * 100;

        arr[id + 0] = this._posBuffer[id + 0] + x
        arr[id + 1] = this._posBuffer[id + 1] + y
        arr[id + 2] = 0
      }
    });

    this._img.geometry.setAttribute('position', new BufferAttribute(arr, 3));
  }


  protected _update(): void {
    super._update()

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    const bgColor = new Color(Param.instance.main.bg.value)
    this.renderer.setClearColor(bgColor, 1)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }

}
