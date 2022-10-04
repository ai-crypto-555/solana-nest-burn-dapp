import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import * as anchor from "@project-serum/anchor";
import holderToken from './TokenAddress.json'
import {
    Commitment,
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
    getParsedNftAccountsByOwner
} from "@nfteyez/sol-rayz";



import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Snackbar, Chip, Container, Checkbox, Input } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { AlertState } from './utils';

import logo from './img/logo.jpg';
import angel from './img/angel.jpg';
import demon from './img/demon.jpg';
import spl_token_source from './keypair.json';

const splToken = require("@solana/spl-token");
const web3 = require("@solana/web3.js");

const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap; 
  justify-content: right;
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE !important;
  margin: 0 auto;
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 20px;
`;

const Price = styled(Checkbox)`
  position: absolute !important;
  margin: 2px;
`;

const Image = styled.img`
  height: 200px;
  width: auto;
  border-radius: 7px;
//   box-shadow: 5px 5px 40px 5px rgba(0, 0, 0, 0.5);
`;

const ImageShow = styled.img`
  height: auto;
  width: 95%;
  border-radius: 7px;
  box-shadow: 5px 5px 40px 5px rgba(0, 0, 0, 0.5);
`;

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;

// const connection = new anchor.web3.Connection(
//     `https://api.mainnet-beta.solana.com`
// );

const connection = new anchor.web3.Connection(
    `https://nameless-hidden-lake.solana-mainnet.quiknode.pro/8f1131ad8d22d311c9b061736167c976a5b08ea0/`
);


const connection1 = new anchor.web3.Connection(
    `https://solana-api.projectserum.com`
);

const nft_burn_amount = process.env.REACT_APP_NFT_BURN_AMOUNT;
const token_burn_amount = process.env.REACT_APP_TOKEN_BURN_AMOUNT;
const spl_token_address = process.env.REACT_APP_SPL_TOKEN_ADDRESS;
const spl_token_decimal = process.env.REACT_APP_SPL_TOKEN_DECIMAL;
const spl_token_address1 = process.env.REACT_APP_SPL_TOKEN_ADDRESS1;
const spl_token_decimal1 = process.env.REACT_APP_SPL_TOKEN_DECIMAL1;

console.log(`mytest::`, nft_burn_amount, token_burn_amount, spl_token_source, spl_token_address);

export interface HomeProps {
    candyMachineId?: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
    network: WalletAdapterNetwork;
}

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isAngel, setAngel] = useState(true);
    const [helAmount, setHelAmount] = useState<any>(0);
    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });
    const [nftList, setNftList] = useState<any[]>();
    const [nftListTmp, setNftTmpList] = useState<any[]>();
    const [transferNftList, setTransferNftList] = useState<String[]>([]);
    const [receiverAddr, setReceiverAddr] = useState<String>('');
    const [traitOption, setTraitOption] = useState<any>();
    const [collection, setCollection] = useState();
    const [trait, setTrait] = useState<any>();

    const [collectionList, setCollectionList] = useState<any[]>([]);
    const [traitList, setTraitList] = useState<any[]>()

    const [traitFilter, setTraitFilter] = useState<any>([]);

    const wallet = useWallet();

    const anchorWallet = useMemo(() => {
        if (
            !wallet ||
            !wallet.publicKey ||
            !wallet.signAllTransactions ||
            !wallet.signTransaction
        ) {
            return;
        }

        return {
            publicKey: wallet.publicKey,
            signAllTransactions: wallet.signAllTransactions,
            signTransaction: wallet.signTransaction,
        } as anchor.Wallet;
    }, [wallet]);

    const checkNFT = (addr: any) => {
        console.log(`addr---`, addr);
        let list = transferNftList;
        let k = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i] == addr) {
                k = i;
            }
        }
        if (k != -1) {
            list.splice(k, 1);
        } else {
            list.push(addr);
        }
        console.log(`list---`, list);
        setTransferNftList(list);
    }

    const onAngel = async () => {
        setAngel(true);

        let helcat = `Bdx9ATvoc2xnieDPRyeCcxpxNsk9fFUUwixhN4rmH6Lo`;
        let hel_tokenPublicKey = new web3.PublicKey(helcat);
        let hel_token = new splToken.Token(
            connection,
            hel_tokenPublicKey,
            splToken.TOKEN_PROGRAM_ID,
            anchorWallet
        );
        let hel_tokenAccount = await hel_token.getOrCreateAssociatedAccountInfo(
            wallet.publicKey
        );
        const myWalletMyTokenBalance = await connection.getTokenAccountBalance(
            hel_tokenAccount.address
        );
        let helcatAmount = myWalletMyTokenBalance.value.uiAmount;
        if (transferNftList.length != Number(nft_burn_amount)) {
            setAlertState({
                ...alertState,
                open: true,
                message: "Please select 9 NFTs",
            })
            return;
        }
        if (helcatAmount == null || helcatAmount < Number(token_burn_amount)) {
            setAlertState({
                ...alertState,
                open: true,
                message: "Your wallet has at least 900 Hellcat token",
            })
            return;
        }

        let _nftList = transferNftList;
        let tokenAccountList: any[] = [];
        let tokenAccountListRes: any[] = [];

        let tokens: any[] = [];
        let instructions: any = [];

        _nftList?.forEach((nft) => {
            let tokenPublicKey = new web3.PublicKey(nft);
            let token = new splToken.Token(
                connection,
                tokenPublicKey,
                splToken.TOKEN_PROGRAM_ID,
                anchorWallet
            );
            tokens.push({
                token: token,
                tokenPublickKey: tokenPublicKey
            });

            let tokenAccount = token.getOrCreateAssociatedAccountInfo(
                wallet.publicKey
            );
            tokenAccountList.push(tokenAccount);
        })

        tokenAccountListRes = await Promise.all(tokenAccountList);

        _nftList.forEach((item, key) => {
            let tokenPublicKey = new web3.PublicKey(item);
            instructions.push(
                splToken.Token.createBurnInstruction(
                    splToken.TOKEN_PROGRAM_ID,
                    tokenPublicKey,
                    tokenAccountListRes[key].address,
                    wallet.publicKey,
                    [],
                    1
                )
            );
        })

        instructions.push(
            splToken.Token.createBurnInstruction(
                splToken.TOKEN_PROGRAM_ID,
                hel_tokenPublicKey,
                hel_tokenAccount.address,
                wallet.publicKey,
                [],
                Number(token_burn_amount) * (10 ** 9)
            )
        );

        var transferTrx = new web3.Transaction().add(
            ...instructions
        )
        var signature = await wallet.sendTransaction(
            transferTrx,
            connection
        );
        const response = await connection.confirmTransaction(signature, 'processed');

        //receive new spl token to this address
        let new_tokenPublicKey = new web3.PublicKey(spl_token_address);

        let sourceWallet = web3.Keypair.fromSecretKey(new Uint8Array(spl_token_source));
        const newToken = new splToken.Token(
            connection,
            new_tokenPublicKey,
            splToken.TOKEN_PROGRAM_ID,
            sourceWallet
        );

        console.log(`1`)


        let tokenAccount = await newToken.getOrCreateAssociatedAccountInfo(
            sourceWallet.publicKey
        );

        const associatedDestinationTokenAddr = await splToken.Token.getAssociatedTokenAddress(
            newToken.associatedProgramId,
            newToken.programId,
            new_tokenPublicKey,
            anchorWallet?.publicKey
        )
        console.log(`2`)

        let instructions1: any[] = [];
        let receiverAccount = connection.getAccountInfo(associatedDestinationTokenAddr)
        if (receiverAccount == null) {
            instructions1.push(
                splToken.Token.createAssociatedTokenAccountInstruction(
                    newToken.associatedProgramId,
                    newToken.programId,
                    new_tokenPublicKey,
                    associatedDestinationTokenAddr,
                    wallet.publicKey,
                    sourceWallet.publicKey,
                )
            );
        }
        instructions1.push(
            splToken.Token.createTransferInstruction(
                splToken.TOKEN_PROGRAM_ID,
                tokenAccount.address,
                associatedDestinationTokenAddr,
                sourceWallet.publicKey,
                [],
                (10 ** Number(spl_token_decimal))
            )
        )

        const transaction1 = new web3.Transaction().add(...instructions1);
        var signature1 = await web3.sendAndConfirmTransaction(
            connection,
            transaction1,
            [sourceWallet]
        );
        console.log(`signature:::`, signature1);
    }

    const onDemon = async () => {
        setAngel(false);
        let helcat = `Bdx9ATvoc2xnieDPRyeCcxpxNsk9fFUUwixhN4rmH6Lo`;
        let hel_tokenPublicKey = new web3.PublicKey(helcat);
        let hel_token = new splToken.Token(
            connection,
            hel_tokenPublicKey,
            splToken.TOKEN_PROGRAM_ID,
            anchorWallet
        );
        let hel_tokenAccount = await hel_token.getOrCreateAssociatedAccountInfo(
            wallet.publicKey
        );
        const myWalletMyTokenBalance = await connection.getTokenAccountBalance(
            hel_tokenAccount.address
        );
        let helcatAmount = myWalletMyTokenBalance.value.uiAmount;
        if (transferNftList.length != Number(nft_burn_amount)) {
            setAlertState({
                ...alertState,
                open: true,
                message: "Please select 9 NFTs",
            })
            return;
        }
        if (helcatAmount == null || helcatAmount < Number(token_burn_amount)) {
            setAlertState({
                ...alertState,
                open: true,
                message: "Your wallet has at least 900 Hellcat token",
            })
            return;
        }

        let _nftList = transferNftList;
        let tokenAccountList: any[] = [];
        let tokenAccountListRes: any[] = [];

        let tokens: any[] = [];
        let instructions: any = [];

        _nftList?.forEach((nft) => {
            let tokenPublicKey = new web3.PublicKey(nft);
            let token = new splToken.Token(
                connection,
                tokenPublicKey,
                splToken.TOKEN_PROGRAM_ID,
                anchorWallet
            );
            tokens.push({
                token: token,
                tokenPublickKey: tokenPublicKey
            });

            let tokenAccount = token.getOrCreateAssociatedAccountInfo(
                wallet.publicKey
            );
            tokenAccountList.push(tokenAccount);
        })

        tokenAccountListRes = await Promise.all(tokenAccountList);

        _nftList.forEach((item, key) => {
            let tokenPublicKey = new web3.PublicKey(item);
            instructions.push(
                splToken.Token.createBurnInstruction(
                    splToken.TOKEN_PROGRAM_ID,
                    tokenPublicKey,
                    tokenAccountListRes[key].address,
                    wallet.publicKey,
                    [],
                    1
                )
            );
        })

        instructions.push(
            splToken.Token.createBurnInstruction(
                splToken.TOKEN_PROGRAM_ID,
                hel_tokenPublicKey,
                hel_tokenAccount.address,
                wallet.publicKey,
                [],
                Number(token_burn_amount) * (10 ** 9)
            )
        );

        var transferTrx = new web3.Transaction().add(
            ...instructions
        )
        var signature = await wallet.sendTransaction(
            transferTrx,
            connection
        );
        const response = await connection.confirmTransaction(signature, 'processed');

        //receive new spl token to this address
        let new_tokenPublicKey = new web3.PublicKey(spl_token_address1);

        let sourceWallet = web3.Keypair.fromSecretKey(new Uint8Array(spl_token_source));
        const newToken = new splToken.Token(
            connection,
            new_tokenPublicKey,
            splToken.TOKEN_PROGRAM_ID,
            sourceWallet
        );

        console.log(`1`)


        let tokenAccount = await newToken.getOrCreateAssociatedAccountInfo(
            sourceWallet.publicKey
        );

        const associatedDestinationTokenAddr = await splToken.Token.getAssociatedTokenAddress(
            newToken.associatedProgramId,
            newToken.programId,
            new_tokenPublicKey,
            anchorWallet?.publicKey
        )
        console.log(`2`)

        let instructions1: any[] = [];
        let receiverAccount = connection.getAccountInfo(associatedDestinationTokenAddr)
        if (receiverAccount == null) {
            instructions1.push(
                splToken.Token.createAssociatedTokenAccountInstruction(
                    newToken.associatedProgramId,
                    newToken.programId,
                    new_tokenPublicKey,
                    associatedDestinationTokenAddr,
                    wallet.publicKey,
                    sourceWallet.publicKey,
                )
            );
        }
        instructions1.push(
            splToken.Token.createTransferInstruction(
                splToken.TOKEN_PROGRAM_ID,
                tokenAccount.address,
                associatedDestinationTokenAddr,
                sourceWallet.publicKey,
                [],
                (10 ** Number(spl_token_decimal1))
            )
        )

        const transaction1 = new web3.Transaction().add(...instructions1);
        var signature1 = await web3.sendAndConfirmTransaction(
            connection,
            transaction1,
            [sourceWallet]
        );
        console.log(`signature:::`, signature1);
    }

    useEffect(() => {
        let flag = false;
        (async () => {
            if (anchorWallet) {
                // const balance = await props.connection.getBalance(anchorWallet!.publicKey);
                const balance = await connection.getBalance(anchorWallet!.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
                const pubkey = anchorWallet.publicKey.toString();
                const tokenList = await getParsedNftAccountsByOwner({
                    publicAddress: pubkey,
                    connection: connection
                });
                console.log(`token list:::`, tokenList);


                let helcat = `Bdx9ATvoc2xnieDPRyeCcxpxNsk9fFUUwixhN4rmH6Lo`;
                let hel_tokenPublicKey = new web3.PublicKey(helcat);
                let hel_token = new splToken.Token(
                    connection,
                    hel_tokenPublicKey,
                    splToken.TOKEN_PROGRAM_ID,
                    anchorWallet
                );
                let hel_tokenAccount = await hel_token.getOrCreateAssociatedAccountInfo(
                    wallet.publicKey
                );
                const myWalletMyTokenBalance = await connection.getTokenAccountBalance(
                    hel_tokenAccount.address
                );
                let helcatAmount = myWalletMyTokenBalance.value.uiAmount;
                setHelAmount(helcatAmount);

                tokenList.forEach(item => {
                    for (let i = 0; i < holderToken.length; i++) {
                        if (item.mint == holderToken[i]) {
                            flag = true;
                        }
                    }
                })

                let responseResult: any[] = [];
                let responseResultRes = [];
                let NftInfoList: any[] = [];

                tokenList.forEach(item => {
                    if (item.data.uri.split(".")[item.data.uri.split(".").length - 1] != 'txt' && item.data.symbol == 'HELLCATS') {
                        responseResult.push(
                            fetch(item.data.uri, {
                                method: 'GET',
                                redirect: 'follow'
                            })
                        );
                    }
                    let tokenPublicKey = new web3.PublicKey(item.mint);
                    let token = new splToken.Token(
                        connection,
                        tokenPublicKey,
                        splToken.TOKEN_PROGRAM_ID,
                        anchorWallet
                    );

                })
                responseResultRes = await Promise.all(responseResult);

                let responseResult1: any[] = [];
                let responseResultRes1: any[] = [];
                responseResultRes.forEach(item => {
                    responseResult1.push(item.json());
                })
                responseResultRes1 = await Promise.all(responseResult1);

                let collectionList: any[] = [];

                responseResultRes1.forEach((ele, key) => {
                    let collection_name: any;
                    if (ele.collection) {
                        collection_name = ele.collection.name;
                    } else {
                        collection_name = ele.symbol
                    }
                    if (collectionList.length > 0) {
                        let flag = 0;

                        collectionList.forEach(item => {
                            if (item.collection == collection_name) {
                                flag = 1;
                            }
                        });
                        if (flag == 0) {
                            collectionList.push({
                                collection: collection_name,
                                attribute: ele.attributes
                            });
                        }
                    } else {
                        collectionList.push({
                            collection: collection_name,
                            attribute: ele.attributes
                        });
                    }

                    NftInfoList.push({
                        ...ele,
                        mint: tokenList[key].mint,
                        uri: ele.image,
                        name: ele.name,
                        // balance: balanceListRes[key].value.uiAmount,
                        collection: collection_name,
                    })
                })

                setCollectionList(collectionList);
                if (collectionList.length > 0) {
                    setCollection(collectionList[0].collection);
                    let traitList: any[] = [];
                    setTraitList(traitList);
                }

                setNftList(NftInfoList)
                setNftTmpList(NftInfoList)
                console.log(NftInfoList.length);
            }
        })();
    }, [anchorWallet, props.connection]);

    return (
        <main>
            <MainContainer >
                <WalletContainer>
                    <div style={{ marginRight: 'auto', marginBottom: '5%' }}>
                        <ImageShow className="gallery-item" style={{ width: 100, height: 100 }}
                            src={logo}
                            alt="NFT To Mint" />
                        <div style={{ marginTop: '10px', fontSize: '20px' }}>{helAmount}{' $HELL'}</div>
                    </div>
                    <Wallet>
                        {wallet ?
                            <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton /></WalletAmount> :
                            <ConnectButton>Connect Wallet</ConnectButton>}
                    </Wallet>
                </WalletContainer>

                <Container style={{ marginTop: '10%', fontSize: 30 }}>
                    <div>UPGRADE YOUR HELLCAT</div>
                </Container>
                <br />
                <br />
                <div style={{ marginBottom: '2%', fontSize: '30px' }}>My NFTs Part</div>
                <div className="scroll" style={{ display: 'flex', overflowX: 'scroll', position: 'relative', backgroundColor: '#1A1D1F', padding: '20px', borderRadius: '15px' }}>
                    {
                        nftList?.map((item: any, key) =>
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', margin: 10 }}>
                                <Price onClick={() => checkNFT(item.mint)} />
                                <Image className="gallery-item"
                                    src={item.uri}
                                    alt="NFT To Mint" />
                            </div>)
                    }

                    {
                        nftList?.length == 0 &&
                        <text style={{ fontSize: 20 }}>No Hellcats found, purchase here: https://magiceden.io/</text>
                    }
                </div>
                <div style={{ marginTop: '5%', fontSize: '30px' }}>Choose Upgrade</div>
                <MintContainer style={{ backgroundColor: '#1A1D1F', borderRadius: '30px', marginTop: '3%' }}>
                    <div style={{ marginTop: '20px' }}>
                        <button className={isAngel ? 'send-btn' : 'send-btn1'} onClick={onAngel}>Overlord Angel</button>
                        <button className={isAngel ? 'send-btn1' : 'send-btn'} onClick={onDemon}>Overlord Demon</button>
                        <div style={{ padding: '20px' }}>
                            Using Your Overlord Upgrade Token, you will be able to mint your overlord
                        </div>
                    </div>
                    <div>
                        <div style={{ backgroundColor: '#111315', margin: '20px', borderRadius: 20 }}>
                            <Image className="gallery-item" style={{ borderRadius: '10px !important', margin: '10%' }}
                                src={isAngel ? angel : demon}
                                alt="NFT To Mint" />
                            <div style={{ color: 'white', padding: '20px', border: '1px solid #1A1D1F' }}>Example of your overlord</div>
                        </div>
                    </div>
                </MintContainer>

            </MainContainer>
            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({ ...alertState, open: false })}
            >
                <Alert
                    onClose={() => setAlertState({ ...alertState, open: false })}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>

        </main>
    );
};

export default Home;
