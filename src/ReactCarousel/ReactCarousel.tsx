import * as React from 'react';
import {throttle} from '@github/mini-throttle';
import deepEqual from 'deep-equal';
import { checkIsMobile, getTranslateParams, getMediaInfo, getMediaRangeSize} from './utils'
import {uuid} from 'imagine-js-utils/key';
// import {dd} from './utils'
import {IInfo, ITouchStart, IBreakpointSettingActual, IReactCarouselProps} from './types';
import elClassName from './el-class-name';

import './styles.css';

// 滑動觸發移動距離
const triggerTouchDistance = 60;

interface IState {
  windowSize: number,
}

const isMobile = checkIsMobile();


class ReactCarousel extends React.Component<IReactCarouselProps, IState> {
  static defaultProps = {
      data: [],
      slidesPerView: 1,
      slidesPerGroup: 1, // 不可為小數
      isEnableLoop: false,
      moveTime: 350,
      breakpoints: {},
      isEnableMouseMove: true,
      isEnablePagination: false,
      isEnableNavButton: false,
      isCenteredSlides: false,
      isDebug: false,
      spaceBetween: 0,
      autoPlayTime: 0,
  };

  _carouselId = uuid();

  timer?: any;
  activePage = 0;        // 真實頁面位置
  activeActualIndex = 0; // 真實項目索引位置
  info: IInfo = {
      formatElement: [],
      sourceTotal: 0, // 來源總數
      // 從0開始
      element: {
          total: 0,
          firstIndex: 0,
          lastIndex: 0
      },
      // 0為實際一開始的位置(往前為負數), 結束值為最後結束位置
      actual: {
          minIndex: 0,
          maxIndex: 0,
          firstIndex: 1,
          lastIndex: 1
      },
      // 總頁數
      pageTotal: 0,
      isDivisible: false,
      residue: 1,
      isVisiblePagination: false,
      isVisibleNavButton: false,
  };


  rwdMedia: IBreakpointSettingActual = {
      slidesPerView: 1,
      slidesPerViewActual: 1,
      slidesPerGroup: 1,
      spaceBetween: 0,
      isCenteredSlides: false,
      isEnableLoop: false,
      isEnableNavButton: true,
      isEnablePagination: true,
      isEnableMouseMove: true,
  };

  touchStart: ITouchStart = {
      pageX: 0,
      pageY: 0,
      x: 0,
      y: 0,
      movePositionX: 0,
      movePositionY: 0,
  };
  state = {
      windowSize: 0,
  };

  // Ref
  rootRef: React.RefObject<HTMLDivElement> = React.createRef();
  slideItemRef: React.RefObject<Array<HTMLDivElement>> = React.createRef();
  carouselRef: React.RefObject<HTMLDivElement> = React.createRef();
  pageRef: React.RefObject<Array<HTMLDivElement>> = React.createRef();
  _throttleHandleResize = () => {};

  constructor(props: IReactCarouselProps) {
      super(props);

      // @ts-ignore
      this.slideItemRef['current'] = [];
      // @ts-ignore
      this.pageRef['current'] = [];

      this._throttleHandleResize = throttle(this._handleResize, 400);

      const {rwdMedia, info} = getMediaInfo(props);
      this.rwdMedia = rwdMedia;
      this.info = info;
      this.state = {
          windowSize: getMediaRangeSize(Object.keys(props.breakpoints)),
      };

  }


  componentDidMount() {

      const element = this.carouselRef?.current;
      if(element){
          // 檢查並開啟自動輪播
          this._checkAndAutoPlay();

          // 首次移動到正確位置
          this.goToActualIndex(this.info.actual.firstIndex, false);

          // 視窗大小變更時(透過節流)
          window.addEventListener('resize', this._throttleHandleResize, false);

          // 移動動畫結束(需要復歸位置, 以假亂真)
          element.addEventListener('transitionend', this._onTransitionend, false);

          if(isMobile){
            element.addEventListener('touchstart', this._onMobileTouchStart, false);
          }else{
            element.addEventListener('mousedown', this._onWebMouseStart, false);
          }
      }

      if(this.props.setCarousel){
          this.props.setCarousel({
              goToPage: this.goToPage,
              info: this.info,
          });
      }

  }

  componentWillUnmount() {
      if(this.timer){
          clearTimeout(this.timer);
      }

      if(this.carouselRef?.current){
          const element = this.carouselRef.current;
          element.removeEventListener('touchstart', this._onMobileTouchStart);
          element.removeEventListener('transitionend', this._onTransitionend);
      }

      window.removeEventListener('resize', this._throttleHandleResize);

  }


  /***
   * 優化渲染
   * @param nextProps
   * @param nextState
   */
  shouldComponentUpdate(nextProps: IReactCarouselProps, nextState: IState) {
      const {windowSize: nextWindowSize} = nextState;
      const {windowSize} = this.state;
      const {data, ...otherParams} = this.props;
      const {data: nextData, ...nextOtherProps} = nextProps;

      const oldKey = data.map((row) => row.key).join('_');
      const nextKey = nextData.map((row) => row.key).join('_');
      if(oldKey !== nextKey ||
        !deepEqual(otherParams, nextOtherProps) ||
        nextWindowSize !== windowSize
      ){
          const {rwdMedia, info} = getMediaInfo(nextProps);
          this.rwdMedia = rwdMedia;
          this.info = info;

          // 重置頁面位置
          const $this = this;
          setTimeout(() => {
              $this.goToPage(1, false);
          }, 0);

          // 設定給外部使用
          if(otherParams.setCarousel){
              otherParams.setCarousel({
                  goToPage: this.goToPage,
                  info: this.info,
              });
          }

          return true;
      }

      return false;
  }


  /**
   * 手機手指按壓
   * @param event
   */
  _onMobileTouchStart = (event: TouchEvent): void => {
      event.preventDefault();

      if(this.carouselRef?.current){
          const element = this.carouselRef.current;
          const movePosition = getTranslateParams(element);

          // 紀錄位置
          this.touchStart = {
              pageX: event.touches[0].pageX,
              pageY: event.touches[0].pageY,
              x: event.touches[0].pageX - movePosition.x,
              y: event.touches[0].pageY - element.offsetTop,
              movePositionX: movePosition.x,
              movePositionY: movePosition.y,
          };

          element.addEventListener('touchmove', this._onMobileTouchMove, false);
          element.addEventListener('touchend', this._onMobileTouchEnd, false);
      }


      if (this.timer) {
          clearTimeout(this.timer);
      }
  };

  _onMobileTouchMove = (event: TouchEvent): void => {
      const endX = event.changedTouches[0].pageX;
      const endY = event.changedTouches[0].pageY;
      const direction = this._getSlideDirection(this.touchStart.pageX, this.touchStart.pageY, endX, endY);
      switch (direction) {
      case 0:
          // // console.log('沒有滑動');
          break;
      case 1:
      case 2:
          // // console.log('上下滑動');

          break;
      case 3:
      case 4:
          // // console.log('左右滑動');

          event.preventDefault();
          const moveX = event.touches[0].pageX;
          this._elementMove(moveX);
          break;

      default:
      }

  };

  /**
   * 手機手指放開
   * @param event
   */
  _onMobileTouchEnd = (event: TouchEvent): void => {
      event.preventDefault();

      if (this.carouselRef?.current) {
          const element = this.carouselRef.current;

          element.removeEventListener('touchmove', this._onMobileTouchMove.bind(this), false);
          element.removeEventListener('touchend', this._onMobileTouchEnd.bind(this), false);
      }
      this._elementMoveDone();
  };

  /**
   *
   * @param moveX 移動X軸
   */
  _elementMove = (moveX: number): void => {

      const translateX = moveX - this.touchStart.x;
      if(this.carouselRef?.current){
          const element = this.carouselRef.current;
          if(this.rwdMedia.isEnableMouseMove && this.slideItemRef.current){
          // 取得移動限制
              const distance = {
                  min: this._getMoveDistance(this.info.actual.minIndex),
                  max: this._getMoveDistance(this.info.actual.lastIndex),
              };

              if ((distance.max < translateX && distance.min > translateX) || this.rwdMedia.isEnableLoop) {
                  // 拖動
                  element.style.transform = `translate3d(${translateX}px, 0px, 0px)`;
                  element.style.transitionDuration = '0ms';
              }
          }
      }



  };


  /**
   * 物件移動結束 (確認停下位置 應該吸在哪個Index位置)
   */
  _elementMoveDone = (): void => {

      if(this.carouselRef?.current){
          const element = this.carouselRef.current;

          // 取得移動位置
          const movePosition = getTranslateParams(element).x;

          // 確認移動距離
          const checkMove = movePosition - this.touchStart.movePositionX;

          if(checkMove <= triggerTouchDistance && checkMove >= -triggerTouchDistance){
              this.goToActualIndex(this.activeActualIndex);

          }else if (checkMove >= -triggerTouchDistance) {
              this.toPrev();
          } else if (checkMove <= triggerTouchDistance) {
              this.toNext();
          }
      }


  };

  /**
   * 網頁滑鼠按下
   * @param event
   */
  _onWebMouseStart = (event: MouseEvent): void => {
      event.preventDefault();

      if(this.carouselRef?.current){
          const element = this.carouselRef.current;
          const movePosition = getTranslateParams(element);

          this.touchStart = {
              pageX: event.clientX,
              pageY: event.clientY,
              x: event.clientX - movePosition.x,
              y: event.clientY - element.offsetTop,
              movePositionX: movePosition.x,
              movePositionY: movePosition.y,
          };

          element.onmousemove = this._onWebMouseMove;
          element.onmouseup = this._onWebMouseEnd;

      }

      if (this.timer) {
          clearTimeout(this.timer);
      }
  }


  /**
   * 網頁滑鼠移動
   * @param event
   */
  _onWebMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      const moveX = event.clientX;

      this._elementMove(moveX);
  };

  /**
   * 網頁滑鼠放開
   * @param event
   */
  _onWebMouseEnd = (event: MouseEvent) => {
      event.preventDefault();

      if(this.carouselRef?.current){
          const element = this.carouselRef.current;
          element.onmousemove = null;
          element.onmouseup = null;
      }


      this._elementMoveDone();
  };

  /**
   * 根據起點和終點的返回方向 1：向上，2：向下，3：向左，4：向右,0：未移動
   * @param startX
   * @param startY
   * @param endX
   * @param endY
   */
  _getSlideDirection = (startX: number, startY: number, endX: number, endY: number) => {
      const dy = startY - endY;
      const dx = endX - startX;
      let result = 0;
      //如果滑動距離太短
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
          return result;
      }
      const angle = this._getSlideAngle(dx, dy);
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


  /**
   * 返回角度
   * @param dx
   * @param dy
   */
  _getSlideAngle = (dx: number, dy: number): number => {
      return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  /**
   * 檢查並自動播放功能
   */
  _checkAndAutoPlay = (): void => {
      const {autoPlayTime} = this.props;

      // 清除上一次的計時器
      if (this.timer) {
          clearTimeout(this.timer);
      }

      if (this.rwdMedia.isEnableLoop && autoPlayTime > 0) {
          this.timer = setTimeout(() => {
              this.toNext();
          }, autoPlayTime);
      }
  }



  /**
   * 重置頁面位置 (LoopMode)
   * 如果元素內是 isClone 則返回到他應該真實顯示的位置
   */
  _onTransitionend = (): void =>  {
      const formatElement = this.info?.formatElement ? this.info.formatElement : [];
      if(formatElement.length > (this.activeActualIndex - 1) && formatElement[this.activeActualIndex].isClone){
          this.goToActualIndex(formatElement[this.activeActualIndex].matchIndex, false);
      }
  };

  /**
   * 處理更改螢幕尺寸時
   */
  _handleResize = () => {
      const {breakpoints} = this.props;
      const {windowSize} = this.state;

      // 只在區間內有設定的值才會 setState
      const selectSize = getMediaRangeSize(Object.keys(breakpoints));

      // 自動導引到目前位置
      // const goIndex = this.activeActualIndex > this.info.actual.lastIndex ? this.info.actual.lastIndex: this.activeActualIndex;
      this.goToPage(1, false);

      if(windowSize !== selectSize){
          this.setState({
              windowSize: selectSize,
          });
      }

  };



  /**
   * 取得下一頁
   */
  getNextPage = ():number => {
      return this.activePage + 1;
  };

  /**
   * 取得下一頁
   */
  getNextPageFirstIndex = ():number => {
      if(this.rwdMedia.isCenteredSlides){
          return this.activeActualIndex + this.rwdMedia.slidesPerGroup;
      }
      // 避免結尾出現空白
      return this.activeActualIndex + this.rwdMedia.slidesPerViewActual;
  };

  /**
   * 取得最大Index
   */
  getMaxIndex = ():number => {
      return this.info.formatElement.length - 1;
  };

  /**
   * 取得虛擬Index
   */
  checkActualIndexInRange = (slideIndex: number): boolean => {
      return slideIndex <= this.info.actual.maxIndex && slideIndex >= this.info.actual.minIndex;
  }


  /**
   * 前往下一頁
   */
  toNext = (): void => {

      const nextPage = this.getNextPage();
      let index = this.activeActualIndex; // 預設為回到原地 (對滑動移動有用)


      if (this.rwdMedia.isEnableLoop && nextPage > this.info.pageTotal && this.info.residue > 0) {
      // 若為Loop(最後一頁移動在不整除的時候, 移動位置需要復歸到第一個)
          index = this.activeActualIndex + this.info.residue;
      } else if (
          this.rwdMedia.slidesPerViewActual < this.info.formatElement.length &&
      this.getNextPageFirstIndex() <= this.getMaxIndex()
      ) {
      // 正常移動到下一頁
          index = this.activeActualIndex + this.rwdMedia.slidesPerGroup;
      }

      this.goToActualIndex(index);
  }

  /**
   * 前往上一個
   */
  toPrev = (): void => {
      let index = this.activeActualIndex; // 預設為回到原地 (對滑動移動有用)
      if (this.rwdMedia.isEnableLoop && this.activePage === 1 && this.info.residue > 0) {
      // 檢查若為Loop(第一頁移動不整除的時候, 移動位置需要復歸到第一個)
          index = this.activeActualIndex - this.info.residue;
      } else if (this.rwdMedia.slidesPerViewActual < this.info.formatElement.length) {
      // 正常移動到上一個
          index = this.activeActualIndex - this.rwdMedia.slidesPerGroup;
      }
      this.goToActualIndex(index);
  }


  /**
   * 前往頁面
   */
  goToPage = (page: number, isUseAnimation = true): void => {
      this.goToActualIndex(page * this.rwdMedia.slidesPerGroup + (this.info.actual.firstIndex - 1), isUseAnimation);
  }



  /**
   * 取得目標項目距離寬度(px)
   * @param slideIndex
   */
  _getMoveDistance = (slideIndex: number): number => {

      if(this.slideItemRef.current){
          const dom = this.slideItemRef.current[slideIndex];
          if (dom) {
              // const movePx = -dom.clientWidth * slideIndex;
              const movePx = -dom.offsetLeft;
              if (this.rwdMedia.isCenteredSlides) {
                  return movePx + (dom.clientWidth * ((this.rwdMedia.slidesPerViewActual - 1) / 2 ));
              }
              return movePx;
          }
      }

      return 0;
  }

  /**
   * 前往實際位置
   */
  goToActualIndex = (slideIndex: number, isUseAnimation = true) => {
      const {moveTime, onChange} = this.props;

      if (Math.ceil(slideIndex) !== slideIndex) {
          throw Error(`slideIndex(${slideIndex}) can't has floating .xx`);
      }

      // 檢查:
      // 1. 移動是否在範圍內
      if (this.checkActualIndexInRange(slideIndex)) {
      // 套用目前位置
          this.activeActualIndex = slideIndex;

          // 計算目前正在第幾頁頁數
          this.activePage = 1;
          if(typeof this.info.formatElement[this.activeActualIndex] !== 'undefined'){
              this.activePage = this.info.formatElement[this.activeActualIndex].inPage;
          }


          // 移動EL位置
          const position = this._getMoveDistance(this.activeActualIndex);
          if(this.carouselRef?.current){
              const element = this.carouselRef.current;
              if(element){
                  element.style.visibility = 'visible';
                  element.style.transitionDuration = isUseAnimation
                      ? `${moveTime}ms`
                      : '0ms';
                  element.style.transform = `translate3d(${position}px, 0px, 0px)`;
              }
          }



          // 提供是否為第一頁/最後一頁的判斷屬性
          if (this.rootRef?.current) {
              if (this.activePage === 1) {
                  if (this.activePage === this.info.pageTotal) {
                      this.rootRef.current.setAttribute('data-position', 'hidden');
                  } else {
                      this.rootRef.current.setAttribute('data-position', 'first');
                  }
              } else if (this.activePage === this.info.pageTotal) {
                  this.rootRef.current.setAttribute('data-position', 'last');
              } else {
                  this.rootRef.current.setAttribute('data-position', '');
              }
          }

          // 更改顯示在第幾個 (父元件使用可判定樣式設定)
          if(this.slideItemRef.current){
              this.slideItemRef.current.forEach((row, index) => {
                  if (row) {
                      if (index === this.activeActualIndex) {
                          row.setAttribute('data-active', 'true');
                      } else if (row) {
                          row.removeAttribute('data-active');
                      }
                  }
              });
          }


          // 更改顯示在第幾頁的樣式 (父元件使用可判定樣式設定)
          if (this.pageRef.current && this.info.isVisiblePagination && this.activePage > 0) {
              this.pageRef.current.forEach((row, index) => {
                  if (this.activePage === index + 1 ) {
                      row.setAttribute('data-active', 'true');
                  } else if (row) {
                      row.removeAttribute('data-active');
                  }
              });
          }

          // 結束移動後再繼續自動模式
          this._checkAndAutoPlay();

          if (onChange) {
              onChange(this.activeActualIndex, this.activePage);
          }
      }
  }

  /**
   * 渲染左右導航區塊
   */
  _renderNavButton = () => {

      const {renderNavButton} = this.props;

      if(typeof renderNavButton !== 'undefined'){
          return renderNavButton(() => this.toPrev(), () => this.toNext());
      }

      return (<div className={elClassName.navGroup}>
          <button type="button" className={elClassName.navPrevButton} onClick={() => this.toPrev()}>
              <div className={elClassName.navIcon}/>
          </button>
          <button type="button" className={elClassName.navNextButton} onClick={() => this.toNext()}>
              <div className={elClassName.navIcon}/>
          </button>
      </div>);
  }

  /**
   * 渲染按鈕區塊
   */
  _renderPagination = () => {
      const {data} = this.props;
      const pageElement = [];

      for (let i = 0; i < this.info.pageTotal; i++) {
          pageElement.push(
              <div
                  ref={(el: any) => {
                      // @ts-ignore
                      this.pageRef.current[i] = el;
                      return false;
                  }}
                  key={`page_${i}`}
                  role='button'
                  onClick={() => this.goToPage(i + 1)}
                  className={elClassName.paginationButton}
                  data-active={this.activePage === i + 1 ? true : undefined}
                  data-page={i + 1}
              >
                  <div className={elClassName.paginationContent}>
                      {data[i]?.paginationContent}
                  </div>
              </div>
          );
      }
      return pageElement;
  }


  render() {
      const {style, className, isDebug} = this.props;
      const {windowSize} = this.state;


      // 產生需要的樣式 (注意結尾符號 ;)
      const slideItemStyle: string = [
          `flex: ${this.rwdMedia.slidesPerView === 'auto'? '0 0 auto' : `1 0 ${100 / this.rwdMedia.slidesPerViewActual}%`};`,
          `padding-left: ${this.rwdMedia.spaceBetween / 2}px;`,
          `padding-right: ${this.rwdMedia.spaceBetween / 2}px;`,
      ].join('');


      return (
          <div
              data-carousel-id={this._carouselId}
              style={style}
              className={[className, elClassName.root].join(' ')}
              ref={this.rootRef}
          >

              {/* Item CSS 樣式 */}
              <style scoped>{`.${elClassName.root}[data-carousel-id="${this._carouselId}"] .${elClassName.slideItem}{${slideItemStyle}}`}</style>

              {/* 左右導航按鈕 */}
              {this.info.isVisibleNavButton && this._renderNavButton()}

              <div className={elClassName.content}>
                  <div
                      ref={this.carouselRef}
                      className={elClassName.carouselContainer}
                      data-is-enable-mouse-move={this.rwdMedia.isEnableMouseMove}
                      data-actual={`${this.info.actual.minIndex},${this.info.actual.firstIndex}-${this.info.actual.lastIndex},${this.info.actual.maxIndex}`}
                  >
                      {this.info.formatElement.map((row, i) => (
                          <div
                              key={`carousel_${i}`}
                              className={elClassName.slideItem}
                              ref={(el: any) => {
                                  // @ts-ignore
                                  this.slideItemRef.current[i] = el;
                                  return false;
                              }}
                              data-active={
                                  row.actualIndex === this.activeActualIndex ? true : undefined
                              }
                              data-actual={row.actualIndex}
                              data-match={row.isClone ? row.matchIndex : undefined}
                              data-is-clone={row.isClone ? true : undefined}
                          >
                              {row.element}

                              {isDebug && (<div className={elClassName.testNumber}>
                                  {row.matchIndex}
                                  {row.isClone && (
                                      <div className={elClassName.cloneIconGroup}>
                                          <div className={elClassName.cloneIcon}/>
                                          {i}
                                      </div>
                                  )}
                              </div>)}
                          </div>
                      ))}
                  </div>
              </div>

              {/* 頁數導航按鈕 */}
              {this.info.isVisiblePagination && (
                  <div className={elClassName.paginationGroup}>
                      {this.info.pageTotal > 0 && this._renderPagination()}
                  </div>
              )}

              {/* 顯示目前偵測尺寸(除錯) */}
              {isDebug && (<div className={elClassName.testWindowSize}>
                  {windowSize}
              </div>)}

              {/*<textarea id="debug-textarea" rows={50}/>*/}
          </div>

      );
  }
}



export default ReactCarousel;


