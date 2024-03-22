import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MenuChangeEvent } from './api/menuchangeevent';

@Injectable({
    providedIn: 'root'
})
export class MenuService {

    /**
     *key: string;
     *routeEvent?: boolean;
     */
    // 菜單變更事件
    private menuSource = new Subject<MenuChangeEvent>();
    // 重置菜單
    private resetSource = new Subject();

    // 訂閱菜單變更事件
    menuSource$ = this.menuSource.asObservable();
    // 閱重置事件
    resetSource$ = this.resetSource.asObservable();

    /**
     * 接收一個MenuChangeEvent參數，並通過menuSource的next方法將該事件發送給訂閱者
     * @param event
     */
    onMenuStateChange(event: MenuChangeEvent) {
        this.menuSource.next(event);
    }

    /**
     * 發送一個true值給resetSource的訂閱者，表示需要重置菜單
     */
    reset() {
        this.resetSource.next(true);
    }
}
