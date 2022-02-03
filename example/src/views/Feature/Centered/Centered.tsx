import React, {useState} from 'react';
import styled from 'styled-components/macro';
import BearCarousel, {ICarouselData, SliderItem} from 'bear-carousel';
import Code from 'components/atoms/Code';
import Content, {SubTitle} from '../../_components/Content';
import {racingImages as images} from 'config/images';




// 輪播項目
const sliderItemData: ICarouselData[]  = images.map(row => {
    return {
        key: row.id,
        children: <SliderItem imageUrl={row.image}/>
    };
});


/**
 * Centered
 */
const Centered = () => {
    const [isLoadData, setIsLoadData] = useState<boolean>(true);


    return <Content
        title="Centered"
        desc="Moved items as to the central position"
        isLoadData={isLoadData}
        onLoadData={setIsLoadData}
    >
        <div className="mb-4">
            <BearCarousel
                data={isLoadData ? sliderItemData: []}
                slidesPerView={3}
                spaceBetween={10}
                isEnableMouseMove
                isEnablePagination
                isCenteredSlides
                aspectRatio={{widthRatio: 32, heightRatio: 9}}
            />
        </div>

        <SubTitle>Source Code</SubTitle>
        <Code language="typescript">
            {`

<BearCarousel
    data={carouselData}
    slidesPerView={4}
    spaceBetween={10}
    isEnableMouseMove
    isEnablePagination
    isCenteredSlides
/>
       `}
        </Code>

    </Content>;
};

export default Centered;


const CarouselBox = styled.div`
  height: 200px;
  display: block;
  overflow: hidden;
 
`;




