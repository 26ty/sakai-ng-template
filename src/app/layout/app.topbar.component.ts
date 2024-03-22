import { Component, ElementRef, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent {

    items!: MenuItem[];

    // 側邊導覽列控制btn-
    @ViewChild('menubutton') menuButton!: ElementRef;

    // rwd側邊導覽列控制btn
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    // topbar menu
    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService) { }
}
