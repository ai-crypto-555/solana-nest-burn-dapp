import { useEffect, useState } from "react";


export default function NFT(props: any) {

    const { imgSrc, myclick, item } = props;
    const [select, setSelect] = useState(false);

    useEffect(() => {
        console.log(`imgsrc::`, imgSrc);
    })

    const nftClick = async () => {
        let selectState = select;
        setSelect(!selectState);
        await myclick(item);
    }

    return (
        <div className="col rg-2 f-center nft">
            <img src={imgSrc} alt="IMG"></img>
            <button onClick={nftClick}>{select ? 'SELECTED' : 'SELECT'}</button>
        </div>
    )
}