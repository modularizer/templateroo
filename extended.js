var extended = {
  settings:{
    demo: {
      tagName: 'demo',
      innerHTML: `
        <div style="display:grid;grid: 100% / 33% 33% 33%;">
          <pre style='background-color:#beb2aa;padding:20px;height:100%;margin:0;overflow:auto;' contenteditable="true" onkeydown="extended.features.demo.onkeydown(event)">@escapedInnerHTML</pre>
          <pre style='background-color:#dbd6c8;padding:20px;height:100%;margin:0;overflow:auto;'>@adjustedHTML</pre>
          <div style='background-color:#c4d6e3;padding:20px;height:100%;overflow:auto;'>@innerHTML</div>
        </div>
      `
    },
  },
  tools: {
    format: (s)=>{
      console.log("s1=",s)
      let a = s
      let c = a.match(/<\/[^]*?>/g)
      a = a.replaceAll(/<\/[^]*?>/g, ')')
      let o = a.match(/<[^]*?>/g)
      a = a.replaceAll(/<[^]*?>/g, '(')
      sample = templateroo.genericTools.re.nested.sortedParenthGroups('a(a(b)c(d(e)f)g)h(i)j(k(l)m)n')
      groups = templateroo.genericTools.re.nested.sortedParenthGroups(`(${a})`)
      console.log({o,c,a, groups, sample})
      s = templateroo.tools.escape(s)
      s = s.replaceAll('&gt','&gt\n')
      s = s.replaceAll('&lt/','\n&lt/')
      return s
    },
    unformat: (s)=>{

    }
  },
  features: {
    demo: {
      onkeydown: (event)=>{
        console.log("this=",this)
        console.log("event=",event)
        if (event.key == 's' && event.ctrlKey){
          let demoEl = event.path[2]
          let el = event.path[0]
          let i = el.innerText
          console.log("i=", i)
          let a = document.createElement('div')
          a.innerHTML=i
          console.log("Ao=", a.outerHTML)
          // let e = templateroo.genericTools.dom.parse.el(i)
          // console.log("e=", e)
          console.log("out=", templateroo.features.template.replace.string(i))
          //
          // i = i.replaceAll('&gt\n', '&gt')
          // i = i.replaceAll('\n&lt/','&lt/')
          // i = i.replaceAll('"',"&quot;")
          // i = templateroo.tools.unescape(i)
          // console.log(i)
          // console.log(templateroo.genericTools.dom.parse.el(i))
          // i = templateroo.features.template.replace.string(i)
          // console.log("i=",i)
          event.preventDefault()
        }
      },
      replace: {
        el: (e)=>extended.features.demo.replace.elAttrObj(el),
        elAttrObj: (elAttrObj)=>{
          /*find the replacement string for a DOM element
          or elementAttributeObject (made in genericTools.dom.elAttrObj)*/
          // let entire = elAttrObj.outerHTML.replaceAll('&amp;','&')
          let entire = elAttrObj.outerHTML
          let r = templateroo.tools.escape(entire)
          return [entire, r]
        },
        string: (s)=>{
          /*escape text within escape tags so it
          is not affected by future operations*/
          let tools = extended.tools
          let tag = extended.settings.demo.tagName
          console.log("s=", s)
          let outer = templateroo.tools.find.tag(s, tag,0)
          console.log({tag, outer})
          outer.map(o=>{
            console.log("o=",o)
            let i = templateroo.genericTools.dom.parse.el(o).innerHTML.trim()
            let demo = extended.settings.demo.innerHTML
            let e = tools.format(i)
            let d = demo.replaceAll('@escapedInnerHTML', e)
            d = d.replaceAll('@innerHTML', i)
            console.log("i=", i)
            let a = extended.features.template.replace.string(i)
            console.log("a=",a)
            a = tools.format(a)
            d = d.replaceAll('@adjustedHTML', a)
            s = s.replace(o, `<${tag}>${d}</${tag}>`)
          })
          return s
        },
      },
    },
    template: {//where the magic happens
      replace: {
        string: (s)=>{
          try{
            templateroo.tools.find.varNames.user()
            let entire = s
            s = s.replaceAll(/<!--[^]*?-->/g,'')
            console.log('here')
            s = extended.features.demo.replace.string(s)
            s = templateroo.features.escape.replace.string(s)
            s = templateroo.features.custom.replace.string(s)
            s = templateroo.features.staticVarReplacement.replace.string(s)
            s = templateroo.features.activeVarReplacement.replace.string(s)

            let initialReplaceTags = ["for","if","switch"].map(v=>templateroo.settings[v].tagName)

            let tagContents= templateroo.tools.find.tagsAttrObjs(s, initialReplaceTags)
            console.log({tagContents})
            let n = tagContents.length
            for (let i=n-1; i>=0; i--){
              for (let elAttrObj of tagContents[i]){
                let t = elAttrObj.tagName.toLowerCase()
                if (initialReplaceTags.includes(t)){
                  let f = templateroo.features[t].replace.string
                  s = f(s)
                }
              }
            }
            s = templateroo.features.activeVarReplacement.label(s)
            s = templateroo.features.eval.replace.string(s)
            return s
          }catch(err){
            console.log(s)
            throw err
          }
        },
        el: (el)=>templateroo.features.template.replace.string(el.outerHTML),
        elAttrObj: (elAttrObj)=> templateroo.features.template.replace.string(elAttrObj.outerHTML),
        doc: ()=>{
          /*templates the entire document*/
          if (templateroo.state.initialhtml == ''){
            templateroo.state.initialhtml = document.documentElement.outerHTML
            let s = extended.features.template.replace.string(templateroo.state.initialhtml)
            state = templateroo.state
            document.write(s)
            templateroo.state = state
            templateroo.features.faviconsvg.init()
            templateroo.features.scrape.init()
          }
        }
      }
    },
  },
  //aliases for the most important functions
  template: (s)=> extended.features.template.replace.string(s),
  templateDoc: ()=> extended.features.template.replace.doc(),
  get: (url, cb=()=>{}, async=true, interval=undefined)=>{
    let r = templateroo.tools.http._get(url, cb, async)
    if (interval != undefined){
      setTimeout(()=>setInterval(()=>templateroo.tools.http._get(url, cb, async),1000*interval),1000*interval)
    }
  },

  init: ()=>{//initialize the templateroo object

    templateroo.tools.init()
    let scriptEl = document.currentScript
    let attr = scriptEl.attributes
    let a = {}
    for (let i=0; i<attr.length; i++){
      a[attr[i].name] = attr[i].value
    }
    if (a.init !== "false"){
      let remover = ()=>{}
      let e = document.addEventListener('DOMContentLoaded', ()=>{
        console.log(a)
        remover()
        extended.templateDoc()
      })
      remover = ()=>{
        document.removeEventListener('DOMContentLoaded', e)
      }

    }
  }
}
extended.init()
