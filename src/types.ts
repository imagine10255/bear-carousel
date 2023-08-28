import {ReactNode, RefObject} from 'react';
import * as CSS from 'csstype';
import BearCarousel from './BearCarousel';
import Controller from './manager/Controller';

export type TSlidesPerView = number|'auto'
export type TSlidesPerViewActual = number

export enum EDevice {
  mobile,
  desktop,
}

export type TRenderNavButton = (toPrev: TToPrev, toNext: TToNext) => ReactNode
export type TRenderPagination = (pageTotal: number) => JSX.Element[]|undefined
export type TStateOnChange = (carouselState: ICarouselState) => void
export type TOnMount = () => void
export type TSlideOnClick = () => void



export interface IBearCarouselProps extends IBreakpointSetting{
  style?: CSS.Properties
  className?: string
  renderNavButton?: TRenderNavButton
  renderPagination?: TRenderPagination
  data?: TBearSlideItemDataList
  moveTime?: number
  autoPlayTime?: number
  breakpoints?: IPropsBreakpoints
  isDebug?: boolean
  isSlideItemMemo?: boolean
  syncCarouselRef?: RefObject<BearCarousel>
  setController?: (controller: Controller) => void
  onSlideChange?: TStateOnChange
  onMount?: TOnMount
}



export interface ICarouselState {
  // element: {
  //   total: number
  //   firstIndex: number
  //   lastIndex: number
  // }
  // 額外整理過的資訊
  virtual: {
    activeIndex: number
    lastIndex: number
    total: number
  }
  // 原始資料的資訊
  source: {
    activeIndex: number
    lastIndex: number
    total: number
  }
  page: {
    activePage: number
    total: number
  }
}

export interface IInfo extends ICarouselState{
  residue: number
  isVisiblePagination: boolean
  isVisibleNavButton: boolean
}
export interface IBearSlideItemData {
  key: string|number
  onClick?: TSlideOnClick
  children: ReactNode
}
export type TBearSlideItemDataList = IBearSlideItemData[];

export type heightUnit = 'px' | '%' | 'em' | 'rem' | 'vh';
export type THeightUnitSize = `${number}${heightUnit}`;

export interface IAspectRatio {
  widthRatio: number
  heightRatio: number
  addStaticHeight?: string
}

interface IMoveEffect {
  transformY?: number,
  moveTime?: string,
}

export interface IBreakpointSetting {
  slidesPerView?: TSlidesPerView
  slidesPerGroup?: number
  height?: IAspectRatio|THeightUnitSize,
  spaceBetween?: number
  isCenteredSlides?: boolean
  isEnableLoop?: boolean
  isEnablePageContent?: boolean
  isEnablePagination?: boolean
  isEnableNavButton?: boolean
  isEnableMouseMove?: boolean
  isEnableAutoPlay?: boolean
  moveEffect?: IMoveEffect
  effectFn?: (el: HTMLElement, percentage: number) => void
}
export interface IBreakpointSettingActual extends IBreakpointSetting {
  slidesPerViewActual: TSlidesPerViewActual
}

export interface IPropsBreakpoints {
  [key: number]: Partial<IBreakpointSetting>
}

export type TToPrev = () => void
export type TToNext = () => void





