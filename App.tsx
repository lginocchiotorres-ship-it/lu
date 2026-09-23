import React,{useEffect}from'react';
import{Platform}from'react-native';
import LiveNewsHome from'./src/LiveNewsHome';

const FAVICON_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="48" fill="#fff"/><circle cx="128" cy="128" r="88" fill="#B58ADB" stroke="#43227F" stroke-width="7"/><circle cx="128" cy="128" r="63" fill="none" stroke="#fff" stroke-width="6"/><path d="M62 185 L112 137 L98 120 L143 82 L138 110 L182 84 L153 127 L171 141 L125 171 L132 146 Z" fill="#fff" stroke="#43227F" stroke-width="7" stroke-linejoin="round"/><path d="M45 205 L112 139" stroke="#43227F" stroke-width="8" stroke-linecap="round"/></svg>`;

export default function App(){
 useEffect(()=>{
  if(Platform.OS==='web'&&typeof document!=='undefined'){
   const href='data:image/svg+xml;utf8,'+encodeURIComponent(FAVICON_SVG);
   let link=document.querySelector<HTMLLinkElement>('link[rel="icon"]');
   if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
   link.type='image/svg+xml';link.href=href;
  }
 },[]);
 return <LiveNewsHome/>;
}
