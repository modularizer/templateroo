var templateroo = {
  settings: {//user parameters, allows you to change names of tags and attributes as well as source of variables
    staticVarReplacement: {
      varHandle: '~x',
    },
    activeVarReplacement: {
      varHandle: '@x',
      varClass: '.x',
      labelTagName: 'label',
    },
    for: {
      tagName: 'for',
      attrNames: {
        handle: 'var',
        range: 'range',
        array: 'list'
      }
    },
    if: {
      tagName: 'if',
      attrNames: {
        condition: 'condition'
      }
    },
    switch: {
      tagName: 'switch',
      attrNames: {
        condition: 'condition'
      },
      case: {
        tagName: 'case',
        attrNames: {
          value: 'val'
        }
      }
    },
    eval: {
      tagName: 'eval'
    },
    escape: {
      tagName: 'esc',
    },
    custom: {
      tagName: 'custom',
      attrNames: {
        tagName: 'tag',
        showTemplate: 'show'
      },
      attrHandle: '~x',
      innerHandle: 'content',
      alwaysShowTemplate: false,
    },
    faviconsvg: {
      tagName: 'faviconsvg'
    },
    scrape: {
      tagName: 'scrape',
      attrNames: {
        src: 'src',
        query: 'query',
        callback: 'onresponse',
        refresh: 'refresh',
        noproxy: 'noproxy',
        regExp: 're'
      },
      proxy: 'https://api.allorigins.win/raw?url=@encodedURL'
    },
    demo: {
      tagName: 'demo',
      innerHTML: `
      <demo>
        <div style="display:grid;grid: 100% / auto auto;">
          <pre style='background-color:#beb2aa;padding:20px;height:100%;margin:0;' contenteditable="true" onkeydown="templateroo.features.demo.onkeydown(event)">@escapedInnerHTML</pre>
          <div style='background-color:#dbd6c8;padding:20px;height:100%;'>@innerHTML</div>
        </div>
      </demo>`
    },
    template: {
      tagName: 'html'
    },
    varObj: window, //object which contains all of the variables which you wish to use for variable replacement
  },
  state: {//track the state of the templateroo Object and the document
    userVarNames: [],//names of variables defined by user
    activeVarNames: [],//active variables in document (which will auto-update)
    initialhtml: '',//initial (untemplated) html of document
    initial: {//store the initial state of elements dependent on active variables
      add: (s)=>{
        let ind = templateroo.state.initial.els.indexOf(s)
        let n = templateroo.state.initial.els.length
        if (ind != -1){
          s = `&&&repeatedValue=&&&${ind}`
        }
        templateroo.state.initial.els.push(s)
        return n
      },
      get: (ind)=>{
        ind*=1
        let s = templateroo.state.initial.els[ind]
        if (s.includes('&&&repeatedValue=&&&')){
          ind = s.split('&&&repeatedValue=&&&')[1]*1
          s = templateroo.state.initial.els[ind]
        }
        return s
      },
      els: []
    },
    custom: {},//store custom tags
  },
  genericTools: {//functions that are in no way specify to templateroo
    escape: {//string escape functions
      re: (s)=> {
        /*escape special regexp characters*/
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ','\\s?')
      },

      html: (s, forward = true)=>{
        /*escape special html characters*/
        let c = {
          "'": "&quot",
          '"': "&quot",
          '<': "&lt",
          '>': "&gt",
          ' ': "&nbsp",
        }
        return templateroo.genericTools.escape.generic(s, c, forward)
      },

      customEscapes: {},//escape custom variable replacement strings
      set: (staticVarMode, activeVarMode)=>{
        /*create variable replacement strings for escaping custom strings*/
        let s = staticVarMode.replace('x','')
        let sv = staticVarMode.replace('x','<wbr>')
        templateroo.genericTools.escape.customEscapes[s]= sv
        let a = activeVarMode.replace('x','')
        let av = activeVarMode.replace('x','<wbr>')
        templateroo.genericTools.escape.customEscapes[a]= av
      },
      custom: (s, forward=true)=>{
        /*escape custom strings specific to templateroo*/
        return templateroo.genericTools.escape.generic(s, templateroo.genericTools.escape.customEscapes, forward)
      },

      and: (s, forward = true)=>{
        /*escape &*/
        return templateroo.genericTools.escape.generic(s, {'&':'&amp;'}, forward)
      },

      generic: (s, obj, forward = true)=>{
        /*helper function for replacements*/
        for (let [k,v] of Object.entries(obj)){
          if (forward){
            s = s.replaceAll(k,v)
          }else{
            s = s.replaceAll(v,k)
          }
        }
        return s
      },
    },
    vars: {//functions used to find and add callback functions to window variables
      find: {
        vars: (varObj, declaredAfter=undefined)=>{
          /*find variables in Object and return as list,
          by default made to fin window variables, but
          could be used for other Obbjects instead*/
          let vars = {}
          let start = declaredAfter==undefined;
          for (let variable in varObj) {
            if (variable !== declaredAfter){
              if (varObj.hasOwnProperty(variable)) {
                if (start){
                  vars[variable] = varObj[variable]}}
            }else{
              start = true}}
          return vars
        },
        userVars: (varObj)=>{
          /*find variables in window declared after this Objet templateroo*/
          return templateroo.genericTools.vars.find.vars(varObj, 'templateroo')
        },
        varNames: (varObj)=> Object.keys(templateroo.genericTools.vars.find.vars(varObj)),
        userVarNames: (varObj)=> Object.keys(templateroo.genericTools.vars.find.userVars(varObj)),
      },
      addCbs: {
        var: (varName, varObj, changeCb=(vn,v)=>{}, setCb=(vn,v)=>{}, getCb=(vn,v)=>{}, prefix = '')=>{
          /*add change, set, and get callback functions to a variable.
          intended for use on window variables, but should work for keys
          of any Object*/
          let val = varObj[varName]
          delete varObj[varName]
          // console.log("val=", varObj[varName])
          console.log(`adding callback functions to variable "${varName}"`)
          Object.defineProperty(varObj, varName,{
            set: (v)=>{
              let o = this['_'+ varName]
              this['_'+ varName] = v;
              if (v != o){
                changeCb(varName, v)
              }
              setCb(varName, v);
            },
            get: ()=>{
              let v = this['_' + varName];
              getCb(varName, v)
              return v
            },
          })
          varObj['_' + varName]= val
          if (varObj[varName] instanceof Object){
            for (let k of Object.keys(varObj[varName])){
              templateroo.genericTools.vars.addCbs.var(k, varObj[varName], changeCb, setCb, getCb, prefix + '.' + k)
            }
          }
        },
        vars: (varNames, varObj, changeCb=(vn,v)=>{}, setCb=(vn,v)=>{}, getCb=(vn,v)=>{})=>{
          /*add callback function to all variables names in list*/
          varNames.map(vn=>templateroo.genericTools.vars.addCbs.var(vn, varObj, changeCb, setCb, getCb))
        },
        userVars: (varObj, changeCb=(vn,v)=>{}, setCb=(vn,v)=>{}, getCb=(vn,v)=>{})=>{
          /*add callback functions to all user variables*/
          let varNames = templateroo.genericTools.vars.find.userVarNames(varObj)
          templateroo.addCbs.vars(varNames)
        },
      },
      monitor: {
        vars: (varNames, changeCb=(vn,v)=>{console.log(vn,"=",v)}, varObj=undefined)=>{
          /*simple example function which will log changes to all window variables
          (assuming templateroo.settings.varObj = window)*/
          return templateroo.genericTools.vars.addCbs.vars(varNames, varObj, changeCb)
        },
        userVars: (changeCb=(vn,v)=>{console.log(vn,"=",v)}, varObj=undefined)=>{
          /*simple example function which will log changes to all user variables
          (assuming templateroo.settings.varObj = window)*/
          let varNames = templateroo.genericTools.vars.find.userVarNames(varObj)
          return templateroo.monitor.vars(varNames, varObj, changeCb)
        },
      },
      get: {
        val: (varName, varObj)=>{
          /* get the value of a variable even with a multi-indexed name: i.e
          evalVar('a.b["c"][2+2]', window) will return window.a.b.c.4 if it exists*/
          try{
            return eval("varObj." + varName)
          }catch{
            return undefined
          }
        },
        valString: (varName, varObj)=>{
          /*gets the value of a variable as a string*/
          return templateroo.genericTools.toString(templateroo.genericTools.vars.get.val(varName, varObj))
        }
      },
    },
    re: {//generic regexp functions
      match: (s, re)=>{
        /*helper to find list of inner most matches*/
        return [...s.matchAll(re)].map((v)=>v.pop()).filter(v=>v)
      },
      replaceObj: (s, obj, forward=true)=>{
        for(let [k,v] of Object.entries(obj)){
          if (forward){
            s = s.replaceAll(new RegExp(k,'g'),v)
          }else{
            s = s.replaceAll(new RegExp(v,'g'),k)
          }
        }
        return s
      },
      nested: {//find levels of matching nested parenthesis (except using <> so it doesn't have to )
        _conversion: {//first step of conversion before finding nested
          '\\(': '&#40',
          '\\)': '&#41',
        },
        _convert: (s, open, close)=>{
          /*convert '(' => '&#40', ')' => '&#41', open => (, and close => )*/
          let gtre = templateroo.genericTools.re
          s = gtre.replaceObj(s, gtre.nested._conversion)
          let o = s.match(new RegExp(open,'g'))
          let c = s.match(new RegExp(close,'g'))
          s = gtre.replaceObj(s, {
            [open]: '(',
            [close]: ')'
          })
          return [s, o, c]
        },
        _unconvert: (s, o, c)=>{
          /*reverse conversion done by _convert*/
          let gtre = templateroo.genericTools.re
          s = s.replaceAll('(',o)
          s = s.replaceAll(')',c)
          s = gtre.replaceObj(s, {'&#40': '(','&#41':')'})
          return s
        },
        parenthGroup: (s, n=1)=>{
          /*find the deepest match sets of () if n=1,
          if n=2, finds the second deepest sets (()), etc.*/
          let res = "\\([^\\)\\(]*?".repeat(n)+ "[^\\)\\(]*?\\)".repeat(n)
          let re = new RegExp(res,'g')
          return s.match(re)
        },
        singleGroup: (s, open, close, n=1)=>{
          /*find the deepest match sets of open-close if n=1,
          if n=2, finds the second deepest sets  open-open-close-close, etc.*/
          let temp = templateroo.genericTools.re.parenthGroup
          s = temp._convert(s, open, close)
          return temp._deepestLevel(s,n).map(temp._unconvert)
        },
        sortedParenthGroups: (s)=>{
          /*find all levels of nested ()*/
          let r = []
          let f = templateroo.genericTools.re.nested.parenthGroup
          let i =1;
          let o = f(s,i);
          while (o){
            r.push(o)
            i++;
            o = f(s,i);
          }
          let c = r.map(v=>v.join(""))
          let out = r.map(v=>[])
          for (let i=0; i<r.length;i++){
            for (let j=0;j<r[i].length;j++){
              out[c.indexOf(c.filter(v=>v.includes(r[i][j])).pop())-i].push(r[i][j])
            }
          }
          return out.map(v=>v.sort((x,y)=>1*(s.indexOf(x)>s.indexOf(y)) - 1*(s.indexOf(x)<s.indexOf(y))))
        },
        sortedGroups: (s, open, close)=>{
          /*find all levels of nested open-close*/
          let temp = templateroo.genericTools.re.nested
          let o; let c;
          [s, o, c] = temp._convert(s, open, close)
          return temp.sortedParenthGroups(s).map(v=>v.map((v,i)=>temp._unconvert(v, o[i], c[i])))
        },
      },
    },
    dom: {//DOM parsing tools
      parse: {
        parser: new DOMParser(),
        doc: (s)=>templateroo.genericTools.dom.parse.parser.parseFromString(s,'text/html'),
        els: (s)=>templateroo.genericTools.dom.parse.doc(s).body.children,
        el: (s)=>templateroo.genericTools.dom.parse.els(s)[0],
      },
      attrObj: (el)=>{
        /*get attributes, innerHTML, tagName, and outerHTML of a DOM  element*/
        let attr = el.attributes
        let a = {innerHTML: el.innerHTML, outerHTML: el.outerHTML, tagName: el.tagName}
        if (attr){
          for (let i=0; i<attr.length; i++){
            a[attr[i].name] = attr[i].value
          }
        }
        return a
      },
      childrenAttrObjs: (s)=>{
        let dom = templateroo.genericTools.dom
        let els = Array.from(dom.parse.els(s))
        return els.map(el=>dom.attrObj(el))
      },
      elAttrObj: (s)=>templateroo.genericTools.dom.childrenAttrObjs(s)[0],
    },
    toString: (v)=>{//convert a value to a string
      /*convert a value to a string*/
      if (typeof v === 'string' || v instanceof String){
        return v
      }else{
        return JSON.stringify(v)
      }
    },
    unique: (arr)=> {//find unique values in a list
      /*find unique values in a list*/
      return arr.filter((v, i, a) => a.indexOf(v) === i)
    },
  },
  tools: {//adapts the genericTools functions for easier usage
    find: {//Object containing string search functions
      varNames: {//find varNames inside of strings
        active: (s)=>{
          /*find active variable names referenced in a string*/
          let vn = templateroo.tools.find.varNames
          let avm = templateroo.settings.activeVarReplacement.varHandle//activeVarMode
          let avns = vn._findVarNames(s, avm)
          let newVars = avns.filter(vn=>!templateroo.state.activeVarNames.includes(vn))
          newVars.map(v=>{templateroo.state.activeVarNames.push(v)})
          templateroo.tools.addAutoUpdate(newVars)
          return avns
        },
        static: (s)=>{
          /*find static variable names referenced in a string*/
          let vn = templateroo.tools.find.varNames
          let svm = templateroo.settings.staticVarReplacement.varHandle//staticVarMode
          return vn._findVarNames(s, svm)
        },
        user: ()=>{
          /*find the names of all user defined variables
          in templateroo.settings.varObj (window by default)*/
          let vgt = templateroo.genericTools.vars
          let uvns = vgt.find.userVarNames(templateroo.settings.varObj)
          uvns.map(vn=>{
            if (!templateroo.state.userVarNames.includes(vn)){
              templateroo.state.userVarNames.push(vn)
            }
          })
          return uvns
        },
        _potential: (s, vm)=>{
          /*find potential variable names*/
          let pre = vm.split('x').shift()
          let post = '"?[+-,;&|()<>\\s\\*]'

          //add space before prefix and space at end,
          //this makes it easier to perform the match
          s = s.replaceAll(pre,` ${pre}`) + ' '
          //string should start with some prefix, and end with ",<,>, or space
          //[\\w\\d\\[\\]\\."']
          let re = new RegExp(`${pre}([\\w\\d\\[\\]\\."']*?)${post}`,'g')
          //find matches
          let m = templateroo.genericTools.re.match(s, re)

          //return ony unique results
          return templateroo.genericTools.unique(m)
        },
        _findVarNames: (s, vm, filter=true)=>{
          /*find variable names referenced in a string
          in order deepest to shallowest and longest to shortest*/
          let f = templateroo.tools.filterVarNames
          let fpvn = templateroo.tools.find.varNames._potential
          let vns = fpvn(s, vm)
          if (filter){
            vns = f(vns)
          }
          //sort by index depth then by length, so ~b[1] is replaced before ~b
          vns.sort((k1, k2)=>{
            let n1 = k1.replaceAll('[','.').match('.').length
            let n2 = k2.replaceAll('[','.').match('.').length
            if (n1==n2){
              n1 = k1.length;
              n2 = k2.length;
            }
            return 1*(n1<n2)-1*(n1>n2)
          })
          return vns
        },
      },
      _tag: (s, open, close, level=undefined)=>{
        /*find groups of a single tag
        level 0 finds outermost, -1 finds innermost*/
        let gtr = templateroo.genericTools.re
        let groups = gtr.nested.sortedGroups(s, open, close)
        let n = groups.length
        if (level == undefined){
          return groups
        }else if (level>=0 && level < n){
          return groups[level]
        }else if (level<0 && level>=(-n)){
          return groups[level+n]
        }else{
          return []
        }
      },
      tag: (s, tag, level=undefined)=>{
        /*find groups of a single tag
        level 0 finds outermost, -1 finds innermost*/
        return templateroo.tools.find._tag(s, `<${tag}[^]*?>`,`<\\/${tag}>`, level)
      },
      tags: (s, tags, level=undefined)=>{
        /*find one or all levels of the tag groups in a string*/
        if (tags.length == 1){
          return templateroo.tools.find.tag(s, tags[0], level)
        }
        let openTag = `<((${tags.join(")|(")}))[^]*?>`
        let closeTag = `<\\/((${tags.join(")|(")}))>`
        return templateroo.tools.find._tag(s, openTag, closeTag, level)
      },
      tagsAttrObjs: (s, tags, level=undefined)=>{
        /*get attribute Objects for each of the specified level tags in a string*/
        let elStrings= templateroo.tools.find.tags(s, tags, level)
        if (level == undefined){
          return elStrings.map(o=>o.map(v=>templateroo.genericTools.dom.elAttrObj(v)))
        }else{
          return elStrings.map(v=>templateroo.genericTools.dom.elAttrObj(v))
        }
      },
      deepestAttrObjs: (s, tags)=>templateroo.tools.find.tagsAttrObjs(s,tags,-1),
      shallowestAttrObjs: (s, tags)=>templateroo.tools.find.tagsAttrObjs(s,tags,0),
    },
    filterVarNames: (varNameS)=>{
      /*filter an array and return only names of actual variables
      in templateroo.settings.varObj (window by default)*/
      if (!Array.isArray(varNameS)){
        varNameS = [varNameS]
      }
      let uvns = templateroo.state.userVarNames
      return varNameS.filter(vn=>uvns.includes(vn.split('.')[0].split('[')[0]))
    },
    addAutoUpdate: (varNames = undefined)=>{
      /*add autoUpdate function to specified variables*/
      if (varNames == undefined){
        varNames = Object.keys(templateroo.state.activeVars)
      }
      let varObj = templateroo.settings.varObj
      let varChangeCb = templateroo.features.activeVarReplacement.varChangeCb
      templateroo.genericTools.vars.monitor.vars(varNames, varChangeCb, varObj)
    },
    escape: (s)=>{
      let gte = templateroo.genericTools.escape
      return gte.custom(gte.html(s))
    },
    unescape: (s)=>{
      let gte = templateroo.genericTools.escape
      return gte.generic(gte.custom(s, false), {
      // "&quot;": "'",
      // "&quot;": '"',
      "&lt;": "<",
      "&gt;":  ">",
      "&nbsp;": ' ',
      })
    },
    init: ()=>{
      templateroo.genericTools.escape.set(templateroo.settings.staticVarReplacement.varHandle, templateroo.settings.activeVarReplacement.varHandle)
    },
    async: {
      ids: [],
      params: {},
      makeID: (url, query='')=>{
        let id = `${url}.${query}.`
        let n = templateroo.tools.async.ids.filter(v=>v.includes(id)).length
        id = id + n
        templateroo.tools.async.ids.push(id)
        return id
      },
      isID: (id)=>templateroo.tools.async.ids.includes(id),
      set: (id, responseText, responseDoc=false, responseEl=false, responseJSON={})=>{
        let el = document.getElementById(id)
        let elAttrObj = templateroo.genericTools.dom.attrObj(el)

        el.innerHTML = responseText
        let data = {
          el: responseEl,
          response: responseText,
          doc: responseDoc,
          json: responseJSON
        }

        let cb = ""
        if (Object.keys(elAttrObj).includes(templateroo.settings.scrape.attrNames.callback)){
          cb = elAttrObj[templateroo.settings.scrape.attrNames.callback]
        }

        for (let [k,v] of Object.entries(data)){
          cb = cb.replaceAll(k,v)
        }
        try{
          console.log(data)
          console.log(eval(cb))
        }catch{
          console.warn('could not evaluate ', cb)
        }
      },
    },
    http: {//tools for making http requests
      _get: (url, cb=()=>{}, async=true)=>{
        var xhttp = new XMLHttpRequest();
        let r = url
        xhttp.onload = function() {
          if (this.readyState == 4 && this.status == 200) {
            r = xhttp.response
            console.log("received response from ", url)
            cb(r)
          }
        };
        xhttp.open("GET", url, async);
        xhttp.send();
        return r
      },
      scrapeGet: (url, proxy = true, query=false, re=false, id=undefined)=>{
        if (id==undefined){
          id = templateroo.tools.async.makeID(url, query)
        }
        let r;
        let cbfn = (s)=>{
          let doc = false
          try{
            doc = templateroo.genericTools.dom.parse.doc(s)
          }catch{}

          let el = false
          let json = false
          if (query){
            el = doc.querySelector(query)
            if (el){
              s = el.outerHTML
            }
          }
          console.log("re=", re, new RegExp(re,'g'))
          if (re){
            try{
              s = s.match(new RegExp(re,'g'))
            }catch{}
          }
          r = s
          templateroo.tools.async.set(id, r, doc, el, json)
        }
        if (proxy){
          let newurl = templateroo.settings.scrape.proxy.replace('@encodedURL',encodeURIComponent(url))
          url = newurl.replaceAll('@URL', url)
        }
        templateroo.tools.http._get(url, cbfn)
        return id
      },
      get: (url, cb=()=>{}, async=true)=>{
        let id = templateroo.tools.async.makeID(url)
        let r;
        var xhttp = new XMLHttpRequest();

        let cbfn = (s)=>{
          cb(s)
          r = s
        }
        templateroo.tools.http._get(url, cbfn, async)
        return [r, id][1*async]
      },
    },
  },
  features: {//functions central to the templating features
    staticVarReplacement: {//static variable replacement
      replace: {
        el: (el)=>templateroo.features.staticVarReplacement.replace.elAttrObj(el),
        elAttrObj: (elAttrObj)=>{
          /*find the replacement string for a DOM element
          or elementAttributeObject (made in genericTools.dom.elAttrObj)*/
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','&')
          let r = templateroo.features.staticVarReplacement.replaceString(entire)
          return [entire, r]
        },
        string: (s)=>{
          /*replace static variables in a string
          this will use templateroo.settings.staticVarReplacement.varHandle*/
          let varNames = templateroo.tools.find.varNames.static(s)//find sorted variable names
          let m = templateroo.settings.staticVarReplacement.varHandle
          varNames.map(varName=>{
            let valString = templateroo.genericTools.vars.get.valString(varName, templateroo.settings.varObj)
            s = s.replaceAll(m.replace('x',varName), valString)
          })
          return s
        },
      }
    },
    activeVarReplacement: {//active variable replacement
      replace: {
        el: (el)=>{
          let elAttrObj = templateroo.genericTools.dom.elAttrObj(el)
          return templateroo.features.activeVarReplacement.elAttrObj(elAttrObj)
        },
        elAttrObj: (elAttrObj)=>{
          /*find the replacement string for anelementAttributeObject
          (made in genericTools.dom.elAttrObj)*/
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','&')
          let r = entire
          if (elAttrObj.tagName !== 'SCRIPT'){
            let t = `<${elAttrObj.tagName.toLowerCase()}`

            //find all active variables in element
            let varNames = templateroo.tools.find.varNames.active(entire)
            // console.log({varNames})

            //update class to include active variables
            let classPresent=false
            let m = templateroo.settings.activeVarReplacement.varClass + ' '
            let classes = varNames.map(v=>m.replace('x',v))
            let cl = elAttrObj.class
            if (!cl){
              cl='';
            }else{
              classPresent = true;
            }
            //update class string
            classes.filter(c=>!cl.includes(c)).map(c=>{cl+=c})
            if (classes.length> 0){
              if (classPresent){//replace class string if present
                r = r.replace(/class=.*?\s"/, `class="${cl}"`)
              }else{//add class string
                r = r.replace(t, `${t} class="${cl}"`)
              }

              //set initialhtml element if not already present
              if (!elAttrObj.initialhtml){//if initialhtml is not present, escape and add
                let ind = templateroo.state.initial.add(entire)
                r = r.replace(t, `${t} initialhtml="${ind}"`)
              }
            }

            //now that class and initialhtml properties are updated and escaped
            //we replace variable handles with values
            r = templateroo.features.activeVarReplacement._replaceString(r)
          }
          return [entire, r]
        },
        string: (s, elAttrObj= undefined)=>{
          /*replace active variables inside an element contained within another string*/
          if (elAttrObj == undefined){
            let childrenAttrObjs = templateroo.genericTools.dom.childrenAttrObjs(s)
            childrenAttrObjs.map(v=>{
              s = templateroo.features.activeVarReplacement.replace.string(s, v)
            })
          }else{
            let [entire, r] = templateroo.features.activeVarReplacement.replace.elAttrObj(elAttrObj)
            s = s.replaceAll(entire, r)
          }
          return s
        },
      },
      label: (s)=>{
        /*label replace active variables in a string
        this will use templateroo.settings.activeVarReplacement.varHandle*/
        let varNames = templateroo.tools.find.varNames.active(s)//find sorted variable names
        let m = templateroo.settings.activeVarReplacement.varHandle
        for (let varName of varNames){
          let label = templateroo.features.activeVarReplacement._labelVar(varName)
          s = s.replaceAll(m.replace('x',varName), label)
        }
        return s
      },
      unlabel: (s)=>{//remove active var labels in string
        /*remove active variable labels in an html string*/
        //do not have to worry about nesting
        let tag = templateroo.settings.activeVarReplacement.label
        let re = new RegExp(`<${tag} .*?>(.*?)<\/${tag}>`,'g')
        let matches = [...s.matchAll(re)]
        for (let m of matches){
          s = s.replace(m[0],m[1])
        }
        return s
      },
      varChangeCb: (varName, varVal)=>{
        /*callback function called every time the value
        of an active variable is chaged*/
        console.log(varName,"= ", varVal)
        let varNames = templateroo.state.activeVarNames
        let classMode = templateroo.settings.activeVarReplacement.varClass
        let elementChangeCb = templateroo.features.activeVarReplacement.elChangeCb
        let els = Array.from(document.getElementsByClassName(classMode.replace("x", varName)))
        els.map(elementChangeCb)
      },
      elChangeCb: (el)=>{
        let entire = el.outerHTML
        let elAttrObj = templateroo.genericTools.dom.elAttrObj(entire)
        if (elAttrObj.initialhtml){
          let s = templateroo.state.initial.get(elAttrObj.initialhtml)
          let r = templateroo.features.template.replace.string(s)
          el.outerHTML = r
        }
      },
      _labelVar: (varName)=>{
        /*make a label element to replace an active variable with*/
        let tag = templateroo.settings.activeVarReplacement.labelTagName
        let valString = templateroo.genericTools.vars.get.valString(varName, templateroo.settings.varObj)
        let cn = templateroo.settings.activeVarReplacement.varClass.replace('x',varName)
        let vs = templateroo.settings.activeVarReplacement.varHandle.replace('x',varName)
        let vsInd = templateroo.state.initial.add(vs)
        let replacement = `<${tag} class="${cn}" initialhtml="${vsInd}">${valString}</${tag}>`
        return replacement
      },
      _replaceString: (s)=>{
        /*simply replace active variable name with their values*/
        let varNames = templateroo.tools.find.varNames.active(s)//find sorted variable names
        let m = templateroo.settings.activeVarReplacement.varHandle
        let f = templateroo.genericTools.vars.get.valString//function to find value
        let vo = templateroo.settings.varObj
        varNames.map(vn=>{
          // console.log("vn", vn,"=", f(vn,vo))
          s = s.replaceAll(m.replace('x',vn),f(vn,vo))
        })
        // console.log("varRep", s)
        return s
      },
    },
    escape: {//escape text so it is displayed as written
      replace: {
        el: (e)=>templateroo.features.escape.replace.elAttrObj(el),
        elAttrObj: (elAttrObj)=>{
          /*find the replacement string for a DOM element
          or elementAttributeObject (made in genericTools.dom.elAttrObj)*/
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','&')
          let r = templateroo.features.escape.replaceString(entire)
          return [entire, r]
        },
        string: (s)=>{
          /*escape text within escape tags so it
          is not affected by future operations*/
          let tools = templateroo.tools
          let tag = templateroo.settings.escape.tagName
          let outer = templateroo.tools.find.tag(s, tag,0)
          // console.log("escape outer=", outer)
          outer.map(o=>{
            let i = templateroo.genericTools.dom.parse.el(o).innerHTML
            // console.log("i=",i)
            s = s.replace(o, `<${tag}>${tools.escape(i)}</${tag}>`)
          })
          return s
        },
      },
    },
    for: {//for loop tools
      replace: {
        elAttrObj: (elAttrObj)=>{
          let v = templateroo.settings.for.attrNames.handle
          let rt = templateroo.settings.for.attrNames.range
          let a = templateroo.settings.for.attrNames.array

          let handle = '~_'
          if (elAttrObj[v]){
            handle = elAttrObj[v]
          }
          let range = false
          if (elAttrObj[rt]){
            range = elAttrObj[rt]
          }

          let list = []
          if (elAttrObj[a]){
            list = elAttrObj[a]
          }

          let inner = elAttrObj.innerHTML
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','&')
          let r = entire
          if (!elAttrObj.done){
            // console.log("range = ", range, templateroo.genericTools.escape.html(range, false))
            if (range){
              let i0;
              let i1;
              let step;
              if (!isNaN(range)){
                i1 = 1*range;
              }else if(Array.isArray(JSON.parse(range))){
                [i0, i1, step] = range
              }
              i0 |= 0
              if (i1==undefined){i1=1}
              if (step==undefined){step=1}
              for (let i= i0; i< i1; i+= step){
                list.push(i)
              }
            }
            if (typeof list === 'string' || list instanceof String){
              // console.log("list = ", list, templateroo.genericTools.escape.html(list, false))
              list = JSON.parse(list)
            }
            console.log({handle, range, list})
            let out = [];
            for (let v of list){
              out.push(inner.replaceAll(handle, v))
            }
            if (elAttrObj.initialHTML){
              r = entire.replace(`>${inner}<`,`>${out.join("\n")}<`)
            }else{
              r = entire.replace(`>${inner}<`,` done>${out.join("\n")}<`)
            }
            console.log({out, entire, r})
          }

          return [entire, r]
        },
        el: (el)=>templateroo.features._generic.replace.el(el, 'for'),
        string: (s)=>templateroo.features._generic.replace.string(s, 'for'),
      },
    },
    if: {//if statement tools
      replace: {
        elAttrObj: (elAttrObj)=>{
          let con = templateroo.settings.if.attrNames.condition
          let c = 'true'
          if (elAttrObj[con]){
            c = elAttrObj[con]
          }
          let inner = elAttrObj.innerHTML
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','')
          let r = entire
          if (!elAttrObj.done){
            r = r.replaceAll(inner, ["",inner][1*(c=="true")])
            if (!elAttrObj.initialhtml){
              r = r.replace('>', ' done>')
            }
          }
          return [entire, r]
        },
        el: (el)=>templateroo.features._generic.replace.el(el, 'if'),
        string: (s)=>templateroo.features._generic.replace.string(s, 'if'),
      }
    },
    switch: {//switch statement tools
      replace: {
        elAttrObj: (elAttrObj)=>{
          let ct = templateroo.settings.switch.case.tagName
          let con = templateroo.settings.switch.attrNames.condition
          let c = 'true'
          if (elAttrObj[con]){
            c = elAttrObj[con]
          }
          let inner = elAttrObj.innerHTML
          let entire = elAttrObj.outerHTML
          let r = entire
          if (!elAttrObj.done){
            let res = `<${ct}[^]*?val\\s*=["\\s[&quot]]*([^]+?)["\\s[&quot]]*?>[^]+?<\\/${ct}>`
            let re = new RegExp(res, 'g')
            let res2 = `<${ct}[^]*?>([^]+?)<\\/${ct}>`
            let re2 = new RegExp(res2, 'g')
            let cases = templateroo.genericTools.re.match(entire, re)
            let vals = templateroo.genericTools.re.match(entire, re2)
            if (cases.includes(c)){
              let i = cases.indexOf(c);
              v = vals[i]
            }
            r = r.replace(inner, v)
            if (!elAttrObj.initialhtml){
              r = r.replace('>', ' done>')
            }
          }
          return [entire, r]
        },
        el: (el)=>templateroo.features._generic.replace.el(el, 'switch'),
        string: (s)=>templateroo.features._generic.replace.string(s, 'switch'),
      }
    },
    eval: {//evaluate tools, NOT active var replacement
      replace: {//DOES NOT do active var replacement, this should be done beforehand
        el: (el)=> templateroo.features.eval.replace.elAttrObj(el),
        elAttrObj: (elAttrObj)=>{
          let entire = elAttrObj.outerHTML.replaceAll('&amp;','')
          let i = templateroo.features.activeVarReplacement.unlabel(elAttrObj.innerHTML)
          let r =entire
          try{
            r = entire.replace(i,eval(i))
          }catch{
          }
          return [entire, r]
        },
        string: (s)=>{
          /*eval text within eval tags*/
          let tools = templateroo.tools
          let tag = templateroo.settings.eval.tagName
          let elAttrObjs = templateroo.tools.find.shallowestAttrObjs(s,[tag])
          elAttrObjs.map(o=>{
            let [e,i] = templateroo.features.eval.replace.elAttrObj(o)
            s = s.replace(e,i)
          })
          return s
        }
      }
    },
    custom: {//create and use code blocks in custom tags
      replace: {
        el: (el)=>templateroo.features._generic.replace.el(el, 'custom'),
        string: (s)=>{
          s = templateroo.features._generic.replace.string(s, 'custom')
          s = templateroo.features.custom.customTags.replace.string(s)
          return s
        },
        elAttrObj: (elAttrObj)=>{
          let entire = elAttrObj.outerHTML
          let settings = templateroo.settings.custom
          let t = settings.attrNames.tagName
          let tag = elAttrObj[t]
          let showAN = settings.attrNames.showTemplate
          let a = {}
          for (let [k,v] of Object.entries(elAttrObj)){
            if (!['outerHTML','tagName','innerHTML',showAN, t].includes(k)){
              a[k]=v
            }
          }
          templateroo.state.custom[tag] = {
            innerHTML: elAttrObj.innerHTML,
            params: a
          }
          let ih = elAttrObj.innerHTML
          let r = ''
          let show = settings.alwaysShowTemplate
          show = Object.keys(elAttrObj).includes(showAN) && elAttrObj[showAN] != "false"
          if (show){
            r = `<${tag}></${tag}>`
          }
          return [entire, r]
        },
      },
      customTags: {
        replace: {
          el: (el)=>{
            let elAttrObj = templateroo.genericTools.dom.elAttrObj(el)
            return templateroo.features.custom.customTags.replace.elAttrObj(elAttrObj)
          },
          string: (s)=>{
            let tools = templateroo.tools
            let tags = Object.keys(templateroo.state.custom)
            // console.log("tags=", tags)
            let groups= templateroo.tools.find.tagsAttrObjs(s, tags)
            // console.log("groups=", groups)
            let f = templateroo.features.custom.customTags.replace.elAttrObj
            for (let i=groups.length-1; i>=0;i--){
              let group = groups[i]
              group.map(o=>{
                let [e,r] = f(o)
                // console.log({e,r,s})
                s = s.replaceAll(e,r)
                // console.log(s)
              })
            }
            return s
          },
          elAttrObj: (elAttrObj)=>{
            // console.log("eAO=",elAttrObj)
            let tag = elAttrObj.tagName.toLowerCase()
            let entire = elAttrObj.outerHTML
            let r = entire
            let tags = Object.keys(templateroo.state.custom)
            let attrs = Object.keys(elAttrObj)
            if (tags.includes(tag)){
              let temp = templateroo.state.custom[tag].innerHTML
              let params = Object.assign({},templateroo.state.custom[tag].params)
              for (let [param, val] of Object.entries(params)){
                if (attrs.includes(param)){
                  params[param] = elAttrObj[param]
                }
              }
              params[templateroo.settings.custom.innerHandle] = elAttrObj.innerHTML
              let out = templateroo.features.custom.customTags._replaceAttributes(temp, params)
              // console.log("matches=", r.match(new RegExp(`>[^]*?<\\/${tag}>`, 'g')))
              // console.log(`>${out}</${tag}>`)
              r = r.replace(new RegExp(`>[^]*?<\\/${tag}>`, 'g'), `>${out}</${tag}>`)

              if (!elAttrObj.initialhtml){//if initialhtml is not present, escape and add
                let ind = templateroo.state.initial.add(entire)
                r = r.replace(tag, `${tag} initialhtml="${ind}"`)
              }
              // console.log("r=", r)
            }
            return [entire, r]
          }
        },
        _replaceAttributes: (s, varObj)=>{
          // console.log(varObj)
          let varHandle = templateroo.settings.custom.attrHandle
          // console.log("varHandle=", varHandle)
          let pvns = templateroo.tools.find.varNames._findVarNames(s, varHandle, false)
          let v = {}
          let vns = Object.keys(varObj)
          // console.log(pvns, vns)
          for (let pvn of pvns){
            if (vns.includes(pvn)){
              let vn = varHandle.replace('x', pvn)
              let vs = templateroo.genericTools.toString(varObj[pvn])
              v[vn] = vs
            }
          }
          // console.log("v=", v)
          // console.log("s=", s)
          s = templateroo.genericTools.escape.generic(s, v)
          // console.log("s_out=", s)
          return s
        }
      }
    },
    faviconsvg: {//add an svg as the site favicon
      make: (svgInnerHTML)=>{
        let encoded = encodeURIComponent(svgInnerHTML)
        let el = document.createElement('link')
        el.setAttribute('rel','icon')
        el.setAttribute('type', "image/svg+xml")
        el.setAttribute('href', `data:image/svg+xml,${encoded}`)
        return el
      },
      makeEl : ()=>{
        let tgn = templateroo.settings.faviconsvg.tagName
        let els = Array.from(document.getElementsByTagName(tgn))
        let el
        if (els){
          let favEl = els[0]
          if (favEl){
            let url = favEl.attributes.src.value
            let elString;
            templateroo.tools.http.get(url, (svgInnerHTML)=>{
              el = templateroo.features.faviconsvg.make(svgInnerHTML)
            }, false)
          }
        }
        return el
      },
      init: ()=>{
        let el = templateroo.features.faviconsvg.makeEl()
        document.head.append(el)
      }
    },
    scrape: {//scrape data from a web request
      init: ()=>{
        let els = Array.from(document.getElementsByTagName(templateroo.settings.scrape.tagName))
        els.map(templateroo.features.scrape.replace.el)
      },
      replace: {
        el: (el)=>{
          console.log(el)
          let elAttrObj = templateroo.genericTools.dom.attrObj(el)
          console.log(elAttrObj)
          let src = elAttrObj[templateroo.settings.scrape.attrNames.src]
          let query = elAttrObj[templateroo.settings.scrape.attrNames.query]
          let refresh = elAttrObj[templateroo.settings.scrape.attrNames.refresh]
          let re = elAttrObj[templateroo.settings.scrape.attrNames.regExp]
          let useProxy= true
          if (Object.keys(elAttrObj).includes(templateroo.settings.scrape.attrNames.noproxy)){
            useProxy = false
          }

          if (Object.keys(elAttrObj).includes(templateroo.settings.scrape.attrNames.refresh) && (refresh == undefined)){
            refresh = 1
          }
          refresh *= 1000


          let get = templateroo.tools.http.scrapeGet
          if (src){
            console.log("src=", src)
            let id = get(src, useProxy, query, re)
            el.setAttribute('id',id)
            if (refresh>0){
              setTimeout(()=>setInterval(()=>get(src, useProxy, query, re, id), refresh),refresh)
            }
          }
        }
      }
    },
    demo: {
      onkeydown: (event)=>{
        if (event.key == 's' && event.ctrlKey){
          let demoEl = event.path[2]
          let el = event.path[0]
          let i = el.innerHTML
          i = i.replaceAll('&gt\n', '&gt')
          i = i.replaceAll('\n&lt/','&lt/')
          i = i.replaceAll('"',"&quot;")
          // let t = templateroo.genericTools.re.nested.sortedGroups(i,'"','"')
          i = templateroo.tools.unescape(i)
          console.log(i)
          console.log(templateroo.genericTools.dom.parse.el(i))
          i = templateroo.features.template.replace.string(i)
          console.log("i=",i)
          event.preventDefault()
        }
      },
      replace: {
        el: (e)=>templateroo.features.demo.replace.elAttrObj(el),
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
          let tools = templateroo.tools
          let tag = templateroo.settings.demo.tagName
          let outer = templateroo.tools.find.tag(s, tag,0)
          // console.log("escape outer=", outer)
          outer.map(o=>{
            let i = templateroo.genericTools.dom.parse.el(o).innerHTML.trim()
            let demo = templateroo.settings.demo.innerHTML
            let e = tools.escape(i)
            e = e.replaceAll('&gt','&gt\n')
            e = e.replaceAll('&lt/','\n&lt/')
            let d = demo.replace('@escapedInnerHTML', e)
            d = d.replace('@innerHTML', i)
            s = s.replace(o, d)
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
            console.log("s=",s)
            s = s.replaceAll('"',"'")
            s = s.replaceAll(/<!--[^]*?-->/g,'')
            s = templateroo.features.demo.replace.string(s)
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
            let s = templateroo.features.template.replace.string(templateroo.state.initialhtml)
            state = templateroo.state
            document.write(s)
            templateroo.state = state
            templateroo.features.faviconsvg.init()
            templateroo.features.scrape.init()
          }
        }
      }
    },
    _generic: {//generic functions used for multiple custom tags
      replace: {
        el: (el, tagName)=>{
          let elAttrObj = templateroo.genericTools.dom.elAttrObj(el)
          return templateroo.features[tagName].replace.elAttrObj(elAttrObj)
        },
        string: (s, tagName)=>{
          let tools = templateroo.tools
          let tag = templateroo.settings[tagName].tagName
          let groups= templateroo.tools.find.tagsAttrObjs(s, [tag])
          let f = templateroo.features[tagName].replace.elAttrObj
          for (let i=groups.length-1; i>=0;i--){
            let group = groups[i]
            group.map(o=>{
              let [e,r] = f(o)
              s = s.replaceAll(e,r)
            })
          }
          return s
        }
      }
    },
  },

  //aliases for the most important functions
  template: (s)=> templateroo.features.template.replace.string(s),
  templateDoc: ()=> templateroo.features.template.replace.doc(),
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
        templateroo.templateDoc()
      })
      remover = ()=>{
        document.removeEventListener('DOMContentLoaded', e)
      }

    }
  }
}
templateroo.init()
