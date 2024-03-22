import { ChangeDetectorRef, Component, Host, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuService } from './app.menu.service';
import { LayoutService } from './service/app.layout.service';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: '[app-menuitem]',
    template: `
		<ng-container>
            <div *ngIf="root && item.visible !== false" class="layout-menuitem-root-text">{{item.label}}</div>
			<a *ngIf="(!item.routerLink || item.items) && item.visible !== false" [attr.href]="item.url" (click)="itemClick($event)"
			   [ngClass]="item.class" [attr.target]="item.target" tabindex="0" pRipple>
				<i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
				<span class="layout-menuitem-text">{{item.label}}</span>
				<i class="pi pi-fw pi-angle-down layout-submenu-toggler" *ngIf="item.items"></i>
			</a>
			<a *ngIf="(item.routerLink && !item.items) && item.visible !== false" (click)="itemClick($event)" [ngClass]="item.class"
			   [routerLink]="item.routerLink" routerLinkActive="active-route" [routerLinkActiveOptions]="item.routerLinkActiveOptions||{ paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
               [fragment]="item.fragment" [queryParamsHandling]="item.queryParamsHandling" [preserveFragment]="item.preserveFragment"
               [skipLocationChange]="item.skipLocationChange" [replaceUrl]="item.replaceUrl" [state]="item.state" [queryParams]="item.queryParams"
               [attr.target]="item.target" tabindex="0" pRipple>
				<i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
				<span class="layout-menuitem-text">{{item.label}}</span>
				<i class="pi pi-fw pi-angle-down layout-submenu-toggler" *ngIf="item.items"></i>
			</a>

			<ul *ngIf="item.items && item.visible !== false" [@children]="submenuAnimation">
				<ng-template ngFor let-child let-i="index" [ngForOf]="item.items">
					<li app-menuitem [item]="child" [index]="i" [parentKey]="key" [class]="child.badgeClass"></li>
				</ng-template>
			</ul>
		</ng-container>
    `,
    animations: [
        trigger('children', [
            state('collapsed', style({
                height: '0'
            })),
            state('expanded', style({
                height: '*'
            })),
            transition('collapsed <=> expanded', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
        ])
    ]
})
export class AppMenuitemComponent implements OnInit, OnDestroy {

    // 接收menu.component.ts [model]
    @Input() item: any;

    // model index
    @Input() index!: number;

    // 將元件樣式綁定到宿主元素的類別
    @Input() @HostBinding('class.layout-root-menuitem') root!: boolean;

    @Input() parentKey!: string;

    // 追蹤選單項目的活動狀態
    active = false;

    // 訂閱選單服務的狀態變化
    menuSourceSubscription: Subscription;

    menuResetSubscription: Subscription;

    key: string = "";

    constructor(
        public layoutService: LayoutService,
        private cd: ChangeDetectorRef,
        public router: Router,
        private menuService: MenuService)
    {
        // 當 menuSource$ 發出新的值時，觀察者的回呼函式會從 menuSource$ 接收到value值
        this.menuSourceSubscription = this.menuService.menuSource$.subscribe(value => {
            // 異步操作
            Promise.resolve(null).then(() => {
                // 選單項目的狀態變化由路由事件觸發
                if (value.routeEvent) {
                    this.active = (value.key === this.key || value.key.startsWith(this.key + '-')) ? true : false;
                }
                else {
                    if (value.key !== this.key && !value.key.startsWith(this.key + '-')) {
                        this.active = false;
                    }
                }
            });
        });

        this.menuResetSubscription = this.menuService.resetSource$.subscribe(() => {
            // 將選單項目重置為非活動狀態
            this.active = false;
        });

        // pipe 用於將多個操作符組合在一起
        // filter 檢查事件是否為 NavigationEnd 類型的事件
        this.router.events.pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(params => {
                // 確保選單項目具有 routerLink 屬性
                if (this.item.routerLink) {
                    this.updateActiveStateFromRoute();
                }
            });
    }

    ngOnInit() {
        // 生成 key 值
        this.key = this.parentKey ? this.parentKey + '-' + this.index : String(this.index);

        if (this.item.routerLink) {
            this.updateActiveStateFromRoute();
        }
    }

    // 根據當前路由狀態更新選單項目的活動狀態。
    updateActiveStateFromRoute() {
        // 檢查當前路由是否與 this.item.routerLink[0] 匹配 (忽略路徑、查詢參數、矩陣參數和片段)
        let activeRoute = this.router.isActive(this.item.routerLink[0], { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' });

        if (activeRoute) {
            // menuSourceSubscription會監聽onMenuStateChange，取得menuSource$
            this.menuService.onMenuStateChange({ key: this.key, routeEvent: true });
        }
    }

    itemClick(event: Event) {
        // avoid processing disabled items
        // 如果 this.item.disabled 為真
        if (this.item.disabled) {
            // 阻止事件的默認行為
            event.preventDefault();
            return;
        }

        // execute command 如果 this.item.command 存在（非空）
        if (this.item.command) {
            this.item.command({ originalEvent: event, item: this.item });
        }

        // toggle active state 如果 this.item.items 子菜單 存在（非空）
        if (this.item.items) {
            this.active = !this.active;
        }

        // 用於通知 menuService 物件菜單狀態的變化
        this.menuService.onMenuStateChange({ key: this.key });
    }

    get submenuAnimation() {
        // 據 this.root 和 this.active 的值返回 'expanded' or 'collapsed'
        return this.root ? 'expanded' : (this.active ? 'expanded' : 'collapsed');
    }

    @HostBinding('class.active-menuitem')
    get activeClass() {
        return this.active && !this.root;
    }

    // 在程式結束時會被調用的生命週期函式 > 通常用於清理和釋放資源
    ngOnDestroy() {
        // 取消訂閱 this.menuSourceSubscription 和 this.menuResetSubscription 這兩個訂閱物件
        if (this.menuSourceSubscription) {
            this.menuSourceSubscription.unsubscribe();
        }

        if (this.menuResetSubscription) {
            this.menuResetSubscription.unsubscribe();
        }
    }
}
