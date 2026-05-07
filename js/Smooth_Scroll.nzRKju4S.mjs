import{__esmMin as e}from"./rolldown-runtime.C_x8Eu_D.mjs";import{init_jsx_runtime as t,init_npm_react_18_2 as n,init_ssg_sandbox_shims as r,l as i,p as a,pe as o,ue as s,window as c}from"./react.QrX8g2pl.mjs";import{ControlType as l,addPropertyControls as u,init_framer_IBYFR5C4 as d}from"./framer.CeB3xQwA.mjs";import{init_lenis_modern as f,r as p}from"./lenis.modern.D4z-TRB_.mjs";function m(e){let{intensity:t}=e,n=o(null);return s(()=>{n.current&&n.current.scrollTo(0,{immediate:!0})},[n]),s(()=>{let e=document.getElementById(`overlay`);if(e){let t=(t,r)=>{for(let r of t)if(r.type===`childList`){let t=e.children.length>0;if(t){let e=document.documentElement,t=c.getComputedStyle(e),r=t.getPropertyValue(`overflow`)===`hidden`;r?n.current.stop():n.current.start()}else n.current.start()}},r=new MutationObserver(t),i={childList:!0};return r.observe(e,i),()=>r.disconnect()}},[]),s(()=>{n.current=new p({duration:t/10});let e=t=>{n.current.raf(t),requestAnimationFrame(e)};return requestAnimationFrame(e),()=>{n.current.destroy(),n.current=null}},[]),a(i,{children:a(`style`,{children:`
      html.lenis {
        height: auto;
      }

      .lenis.lenis-smooth {
        scroll-behavior: auto !important;
      }

      .lenis.lenis-smooth [data-lenis-prevent] {
        overscroll-behavior: contain;
      }

      .lenis.lenis-stopped {
        overflow: hidden;
      }

      .lenis.lenis-scrolling iframe {
        pointer-events: none;
      }
    `})})}var h=e((()=>{r(),t(),d(),f(),n(),m.displayName=`Smooth Scroll`,u(m,{intensity:{title:`Intensity`,type:l.Number,defaultValue:10}})}));export{m as SmoothScroll,h as init_Smooth_Scroll};
//# sourceMappingURL=Smooth_Scroll.nzRKju4S.mjs.map