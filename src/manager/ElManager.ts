import {IInfo, TBearSlideItemDataList} from '../types';
import {
    calcMoveTranslatePx,
    checkActualIndexInRange,
    checkInRange,
    getMoveDistance,
    getMovePercentage, getNextIndex, getPrevIndex,
    getSlideIndex,
    getStartPosition,
    initDataList
} from '../utils';
import SlideSettingManager from './SlideSettingManager';
import * as React from 'react';
import SlideItemManager from './SlideItemManager';
import elClassName from '../el-class-name';
import PositionManager from './PositionManager';
import log from '../log';

class ElManager {
    _rootRef: React.RefObject<HTMLDivElement> = React.createRef();
    _containerRef: React.RefObject<HTMLDivElement> = React.createRef();
    _slideItemRefs: React.RefObject<Array<HTMLDivElement>> = React.createRef();
    _pageRefs: React.RefObject<Array<HTMLDivElement>> = React.createRef();
    _pageGroupRef: React.RefObject<HTMLDivElement> = React.createRef();
    _navGroupRef: React.RefObject<HTMLDivElement> = React.createRef();

    private _slideSettingManager: SlideSettingManager;
    private _slideItemManager: SlideItemManager;
    private _positionManager: PositionManager;

    moveTime = 500;

    constructor(manager: {
        slideSettingManager: SlideSettingManager,
        slideItemManager: SlideItemManager,
        positionManager: PositionManager,
    }) {
        // @ts-ignore
        this._slideItemRefs.current = [];
        // @ts-ignore
        this._pageRefs.current = [];

        this._slideSettingManager = manager.slideSettingManager;
        this._slideItemManager = manager.slideItemManager;
        this._positionManager = manager.positionManager;

    }

    get rootEl(){
        return this._rootRef.current;
    }
    get containerEl(){
        return this._containerRef.current;
    }
    get slideItemEls(){
        return this._slideItemRefs.current;
    }
    get pageEls(){
        return this._pageRefs.current;
    }
    get pageGroupEl(){
        return this._pageGroupRef.current;
    }
    get navGroupEl(){
        return this._navGroupRef.current;
    }


    /**
     * Move Percentage
     * @param movePx
     */
    getMovePercentage = (movePx: number) => {
        const {actual} = this._slideItemManager;
        const slideCurrWidth = this.slideItemEls[actual.activeIndex].clientWidth;
        const startPosition = this._getStartPosition(slideCurrWidth);
        return getMovePercentage(movePx, startPosition, slideCurrWidth);
    };


    /**
     * 取得初始距離
     * @param slideItemWidth
     */
    private _getStartPosition = (slideItemWidth: number) => {
        return getStartPosition(this._slideSettingManager.setting.isCenteredSlides,
            {
                slidesPerView: this._slideSettingManager.setting.slidesPerView,
                slidesPerViewActual: this._slideSettingManager.setting.slidesPerViewActual,
            },
            {
                containerWidth: this.rootEl.clientWidth,
                currItemWidth: slideItemWidth,
            }
        );
    };

    /**
     * Get the target item distance width(px)
     * @param slideIndex
     */
    getMoveDistance = (slideIndex: number): number => {
        if (this.slideItemEls) {
            const slideItemRef = this.slideItemEls[slideIndex];
            if (slideItemRef) {
                return getMoveDistance(slideItemRef.offsetLeft, this._getStartPosition(slideItemRef.clientWidth));
            }
        }

        return 0;
    };


    /**
     * 加上狀態讓其他元素不會影響滑動
     * @param isEnable
     */
    setNonSubjectTouch = (isEnable: boolean) => {
        if(this.pageGroupEl){
            this.pageGroupEl.setAttribute('data-touch', isEnable ? 'true': 'false');
        }
        if(this.navGroupEl){
            this.navGroupEl.setAttribute('data-touch', isEnable ? 'true': 'false');
        }
    };



    setSlideItemRefs(el: HTMLDivElement, index: number){
        this._slideItemRefs.current[index] = el;
    }
    setPageRefs(el: HTMLDivElement, index: number){
        this._pageRefs.current[index] = el;
    }



}


export default ElManager;
