import * as React from 'react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';

import BearCarousel from '../src/BearCarousel';
import BearSlideItem from '../src/BearSlideItem';



describe('Index testing', () => {
    let container: HTMLElement,
        slideItems: HTMLElement[],
        pageButtons: HTMLElement[],
        navNextButton: HTMLElement,
        navPrevButton: HTMLElement;

    beforeEach(() => {
        const mockData = new Array(6).fill('test');
        render(<BearCarousel
            data={mockData.map((row, index) => {
                return {key: index, children: <BearSlideItem as="card"/>};
            })}
            isEnableNavButton
            isEnablePagination
        />);

        container = screen.getByTestId('bear-carousel-container');
        slideItems = screen.getAllByTestId('bear-carousel-slideItem');
        pageButtons = screen.getAllByTestId('bear-carousel-page-button');
        navNextButton = screen.getByTestId('bear-carousel-navNextButton');
        navPrevButton = screen.getByTestId('bear-carousel-navPrevButton');

        setContainerSize(container, 400);
        setSlideItemsSizes(slideItems, 400);

    });

    afterEach(() => {
        cleanup();
    });

    function setSlideItemsSizes(elements: HTMLElement[], size: number) {
        elements.forEach((el, index) => {
            Object.defineProperty(el, 'clientWidth', {configurable: true, value: size});
            Object.defineProperty(el, 'offsetLeft', {configurable: true, value: size * index});
        });
    }

    function setContainerSize(element: HTMLElement, size: number) {
        Object.defineProperty(element, 'clientWidth', {configurable: true, value: size});
        Object.defineProperty(element, 'offsetLeft', {configurable: true, value: 0});
    }

    function getActiveSlideItem() {
        return slideItems.find(el => el.dataset.active === 'true');
    }

    function getActivePageButton() {
        return pageButtons.find(el => el.dataset.active === 'true');
    }

    test('Bear Carousel is in the document', () => {
        const rootElement = screen.getByTestId('bear-carousel');
        expect(rootElement).toBeInTheDocument();
    });

    test('navButton is in the document', () => {
        expect(navNextButton).toBeInTheDocument();
        expect(navPrevButton).toBeInTheDocument();
    });

    test('pageButtons is six and in the document', () => {
        expect(pageButtons).toHaveLength(6);
    });

    test('slideItems is six and in the document', () => {
        expect(slideItems).toHaveLength(6);
    });

    test('pageButtons is in the document', () => {
        expect(pageButtons).toHaveLength(6);
    });

    test('Navigates to third page using next button', async () => {
        // ACT - navigate to third page
        await userEvent.click(navNextButton);
        await userEvent.click(navNextButton);

        // ASSERT
        const activeSlideItem = getActiveSlideItem();
        const activePageButton = getActivePageButton();

        expect(activeSlideItem).toHaveAttribute('data-page','3');
        expect(activePageButton).toHaveAttribute('data-page','3');
    });

    test('Navigates back to first page using prev button', async () => {
        // ACT - navigate to two page
        await userEvent.click(navPrevButton);

        // ASSERT
        const activeSlideItem = getActiveSlideItem();
        const activePageButton = getActivePageButton();

        expect(activeSlideItem).toHaveAttribute('data-page','1');
        expect(activePageButton).toHaveAttribute('data-page','1');
    });


    test('Navigates back to second page from third page using prev button', async () => {
        expect(navNextButton).toBeInTheDocument();
        expect(navPrevButton).toBeInTheDocument();

        // ACT - navigate to third page
        await userEvent.click(navNextButton);
        await userEvent.click(navNextButton);

        // ACT - navigate back to second page
        await userEvent.click(navPrevButton);

        // ASSERT
        const activeSlideItem = getActiveSlideItem();
        const activePageButton = getActivePageButton();

        expect(activeSlideItem).toHaveAttribute('data-page','2');
        expect(activePageButton).toHaveAttribute('data-page','2');
    });


    test('Navigates to third page using pagination button', async () => {
        // Act
        const targetPageButton = pageButtons.find(el => el.dataset.page === '3');

        // ASSERT
        await userEvent.click(targetPageButton);

        const activeSlideItem = getActiveSlideItem();
        const activePageButton = getActivePageButton();

        expect(activeSlideItem).toHaveAttribute('data-page','3');
        expect(activePageButton).toHaveAttribute('data-page','3');
    });



    test('Desktop drag to third page using next button', async () => {
        // Act
        fireEvent.mouseDown(container, {clientX: 500});
        fireEvent.mouseMove(container, {clientX: 290});

        // ASSERT
        expect(container.style.transform).toEqual('translate(-210px, 0px)');

        // Act
        fireEvent.mouseUp(container);

        // ASSERT
        expect(container.style.transform).toEqual('translate(-400px, 0px)');
        expect(getActiveSlideItem()).toHaveAttribute('data-page','2');
    });

    test('Mobile drag to third page using next button', async () => {
        // Act
        fireEvent.touchStart(container, {targetTouches: [{pageX: 500}]});
        fireEvent.touchMove(container, {targetTouches: [{pageX: 290}]});

        // ASSERT
        expect(container.style.transform).toEqual('translate(-210px, 0px)');

        // Act
        fireEvent.touchEnd(container);

        // ASSERT
        expect(container.style.transform).toEqual('translate(-400px, 0px)');
        expect(getActiveSlideItem()).toHaveAttribute('data-page','2');
    });

});
