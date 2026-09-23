import React,{useEffect}from'react';
import{Platform}from'react-native';
import LiveNewsHome from'./src/LiveNewsHome';

export default function App(){
 useEffect(()=>{
  if(Platform.OS==='web'&&typeof document!=='undefined'){
   let link=document.querySelector<HTMLLinkElement>('link[rel="icon"]');
   if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
   link.type='image/svg+xml';link.href='/novo-icon.svg';
  }
 },[]);
 return <LiveNewsHome/>;
}
