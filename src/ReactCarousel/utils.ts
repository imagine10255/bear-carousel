import {IBreakpointSetting, TSlidesPerView, IBreakpointSettingActual, IInfo, IPropsBreakpoints, IReactCarouselProps} from './types';

/**
 * 取得螢幕尺寸對應設定尺寸
 * @param breakpointSizes
 */
export function getMediaRangeSize(breakpointSizes: string[]): number{
    const windowSize = typeof document !== 'undefined' ? window.innerWidth : 0;

    // @ts-ignore
    const filterArray: number[] = breakpointSizes.filter(
        (size) => Number(size) <= windowSize
    ) as number[];
    filterArray.sort((a, b) => Number(b) - Number(a));

    if (filterArray.length > 0) {
        return filterArray[0];
    }
    return 0;
}


/**
 * 取得響應式設定
 * @param setting
 * @param breakpoints
 */
export function getMediaSetting(setting: IBreakpointSetting, breakpoints: IPropsBreakpoints): IBreakpointSettingActual {
    const selectSize = getMediaRangeSize(Object.keys(breakpoints));
    if(selectSize > 0){
        setting = Object.assign(setting, breakpoints[selectSize]);
    }

    // 若顯示項目大於來源項目, 則關閉Loop
    // if (setting.slidesPerView > dataLength) {
    //     setting.isEnableLoop = false;
    // }

    const slidesPerViewActual = setting.slidesPerView === 'auto' ? 1: setting.slidesPerView;
    return {
        ...setting,
        slidesPerViewActual: slidesPerViewActual,
        isEnableLoop: setting.slidesPerView === 'auto' ? false : setting.isEnableLoop,
        slidesPerGroup: setting.slidesPerGroup > slidesPerViewActual ? slidesPerViewActual:setting.slidesPerGroup, // fix
    };
}


/**
 * 取得響應式設定
 * @param props
 */
export function getMediaInfo(props: IReactCarouselProps): {rwdMedia: IBreakpointSettingActual, info: IInfo} {

    const {data, breakpoints, slidesPerGroup, slidesPerView, spaceBetween, isEnableLoop, isEnableNavButton, isEnableMouseMove, isEnablePagination, isCenteredSlides} = props;

    const rwdMedia = getMediaSetting({
        slidesPerView: slidesPerView,
        slidesPerGroup: slidesPerGroup,
        spaceBetween: spaceBetween,
        isCenteredSlides: isCenteredSlides,
        isEnableLoop: isEnableLoop,
        isEnableNavButton: isEnableNavButton,
        isEnablePagination: isEnablePagination,
        isEnableMouseMove: isEnableMouseMove,
    }, breakpoints);


    const divisible = data.length % rwdMedia.slidesPerGroup; // 餘數
    let sliceData = divisible > 0 ? data.slice(0, data.length - divisible) : data;
    let sourceTotal = sliceData.length;
    const formatElement = initDataList(
        sliceData,
        rwdMedia.slidesPerViewActual,
        rwdMedia.slidesPerGroup,
        rwdMedia.isEnableLoop
    );


    const elementTotal = formatElement.length;
    const cloneBeforeTotal = rwdMedia.isEnableLoop ? rwdMedia.slidesPerViewActual : 0;
    const cloneAfterTotal = cloneBeforeTotal;
    const actualMinIndex = 0;
    const actualMaxIndex = elementTotal - 1;

    // if (rwdMedia.slidesPerGroup > rwdMedia.slidesPerViewActual) {
    //     // throw Error(
    //     //     `slidesPerGroup(${rwdMedia.slidesPerGroup}) can't > slidesPerView(${rwdMedia.slidesPerViewActual})`
    //     // );
    // } else if (Math.ceil(rwdMedia.slidesPerGroup) !== rwdMedia.slidesPerGroup) {
    //     throw Error(
    //         `slidesPerGroup(${rwdMedia.slidesPerGroup}) can't has floating .xx`
    //     );
    // }

    let fakeTotalPage = Math.ceil(sourceTotal / rwdMedia.slidesPerGroup);
    if(!rwdMedia.isEnableLoop && rwdMedia.slidesPerView !== 'auto' && !rwdMedia.isCenteredSlides){
        fakeTotalPage = fakeTotalPage - (rwdMedia.slidesPerView - rwdMedia.slidesPerGroup);
    }

    const info: IInfo = {
        formatElement,
        sourceTotal, // 來源總數
        // 從0開始
        element: {
            total: elementTotal,
            firstIndex: 0,
            lastIndex: elementTotal - 1
        },
        // 0為實際一開始的位置(往前為負數), 結束值為最後結束位置
        actual: {
            minIndex: actualMinIndex,
            maxIndex: actualMaxIndex,
            firstIndex: Math.ceil(cloneBeforeTotal),
            lastIndex: Math.ceil(sourceTotal + cloneAfterTotal - 1)
        },
        // 總頁數
        // pageTotal: fakeTotalPage - (rwdMedia.slidesPerView - (elementTotal % rwdMedia.slidesPerView)),
        pageTotal: fakeTotalPage,
        isDivisible: divisible === 0,
        residue: elementTotal % rwdMedia.slidesPerGroup,
        isVisiblePagination: rwdMedia.isEnablePagination && formatElement.length > 0,
        isVisibleNavButton: rwdMedia.isEnableNavButton && formatElement.length > 0
    };

    return {
        info,
        rwdMedia,
    };
}


/**
 * 初始化資料
 * @param sourceList
 * @param slidesPerView
 * @param slidesPerGroup
 * @param isLoop
 */
function initDataList(sourceList: Array<any> = [], slidesPerView: TSlidesPerView = 1, slidesPerGroup = 1, isLoop= false): Array<{
  actualIndex: number;
  matchIndex: number;
  inPage: number;
  isClone: boolean;
  element: React.ReactNode;
}> {
    const formatList = [];
    const isClone = isLoop && typeof window !== 'undefined';
    let index = 0;
    const formatSlidesPerView = slidesPerView === 'auto' ? 0: Math.ceil(slidesPerView);
    const lastPage = (sourceList.length / slidesPerGroup) - (slidesPerGroup - formatSlidesPerView);

    if (isClone) {
    // 複製最後面, 放在最前面

        const cloneStart = (sourceList.length - formatSlidesPerView);
        // eslint-disable-next-line no-restricted-syntax
        for (const row of sourceList.slice(-formatSlidesPerView)) {
            formatList[index] = {
                actualIndex: index,
                matchIndex: formatSlidesPerView + cloneStart + index,
                inPage: 1,
                isClone: true,
                element: row.children,
            };
            index += 1;
        }
    }

    let matchFirstIndex = index;
    let pageFirstIndex = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const row of sourceList) {
        formatList[index] = {
            actualIndex: index,
            matchIndex: index,
            inPage: Math.ceil((pageFirstIndex + 1) / slidesPerGroup),
            // inPage: info.pageTotal - (rwdMedia.slidesPerView - (info.element.total % rwdMedia.slidesPerView)),
            isClone: false,
            element: row.children,
        };
        index += 1;
        pageFirstIndex += 1;
    }

    if (isClone) {
    // 複製前面的(需顯示總數) 放在最後面

        // eslint-disable-next-line no-restricted-syntax
        for (const row of sourceList.slice(0, formatSlidesPerView)) {
            formatList[index] = {
                actualIndex: index,
                matchIndex: matchFirstIndex,
                inPage: lastPage,
                isClone: true,
                element: row.children,
            };
            index += 1;
            matchFirstIndex += 1;
        }
    }
    return formatList;
}


/**
 * 計算 返回角度
 * @param dx
 * @param dy
 */
export function getSlideAngle(dx: number, dy: number): number {
    return Math.atan2(dy, dx) * 180 / Math.PI;
}


/**
 * 取得 transform 3d x 移動參數
 * @param el
 */
export function getTranslateParams(el: HTMLDivElement): {x: number, y: number, z: number}{
    const values = el.style.transform.split(/\w+\(|\);?/);
    if (!values[1] || !values[1].length) {
        return {x: 0, y: 0, z: 0};
    }

    const result = values[1].split(',');
    return {
        x: Number(result[0].replace('px', '')),
        y: Number(result[1].replace('px', '')),
        z: Number(result[2].replace('px', '')),
    };
}


/**
 * 根據起點和終點的返回方向
 * @param startX
 * @param startY
 * @param endX
 * @param endY
 *
 * @return 1:向上, 2:向下, 3:向左, 4:向右, 0:未移動
 */
export function getSlideDirection(startX: number, startY: number, endX: number, endY: number): number{
    const dy = startY - endY;
    const dx = endX - startX;
    let result = 0;
    //如果滑動距離太短
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        return result;
    }
    const angle = getSlideAngle(dx, dy);
    if (angle >= -45 && angle < 45) {
        result = 4;
    } else if (angle >= 45 && angle < 135) {
        result = 1;
    } else if (angle >= -135 && angle < -45) {
        result = 2;
    } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        result = 3;
    }
    return result;
}


