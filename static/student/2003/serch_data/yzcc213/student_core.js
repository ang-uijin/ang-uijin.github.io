//Author: linss@ms1.url.com.tw
var Leader_Msg, Leader_Tmp
var Str_Cnt=Str_DB.length
function Query(v){
var Q_Str=v.replace(/^[\s]+/g,"").replace(/[\s]+$/g,"")//移除關鍵字頭尾的空白字元
document.all.QT.value=Q_Str
if(Q_Str){
var P_Str, Pos_0, Pos_L, Pos_R, Pos_1, Pos_2
var Result_Str="", NotFound=true
for(i=0;i<Str_Cnt;i++){
eval('qt = /'+Q_Str+'/g')
var Found=Str_DB[i][2].match(qt)//比對檢索檔的資料與關鍵字是否吻合
if(Found){
Pos_0=Str_DB[i][2].indexOf(Q_Str)//以下的方法可使文字片段的長度一致，這花了我很多時間思考此問題
Pos_L=(Pos_0-40<1)?Math.abs(Pos_0-40):0
Pos_R=(Str_DB[i][2].length-(Pos_0+40)<1)?Math.abs(Str_DB[i][2].length-(Pos_0+40)):0
Pos_1=Pos_0-40-Pos_R
Pos_2=Pos_0+40+Pos_L
P_Str=Str_DB[i][2].substring(Pos_1,Pos_2).replace(qt,"<font color=red>"+Q_Str+"</font>")//擷取文字片段並強調顯示關鍵字
Result_Str+="<table border=0 cellpadding=3 class=text><tr><td bgcolor=#f5f5f5>"
Result_Str+="在【 "+Str_DB[i][1].link(Str_DB[i][0])+" 】這件作品中，找到 "+Found.length+" 個："
Result_Str+="</td></tr><tr><td >"+P_Str+"..."
Result_Str+="</td></tr></table><hr size=1 color=#9BC57C >"
NotFound=false
}
}
Leader_Tmp=(NotFound)?"找不到相關資料！":"，搜尋結果如下：<hr size=1 color=#9BC57C>"
Leader_Msg="您輸入的關鍵字『 <font color=red>"+Q_Str+"</font> 』"+Leader_Tmp
Result_Str=Leader_Msg+Result_Str
Show_Result.innerHTML=Result_Str
}else{
Show_Result.innerHTML="<font color=#ff6060>您必須先輸入關鍵字才能進行檢索！</font>"
}
}
function initmsg(){
var Tot_Len=0
for(i=0;i<Str_Cnt;i++){
Tot_Len+=Str_DB[i][2].length
}
var Tot_Tmp=eval('""+Tot_Len').length
if(Tot_Tmp>3&&Tot_Tmp<7){//在千位數插入逗號
Tot_Len=eval('""+Tot_Len').substring(0,Tot_Tmp-3)+","+eval('""+Tot_Len').substring(Tot_Tmp-3,Tot_Tmp)
}
Show_Result.innerHTML="已載入 "+Str_Cnt+" 件學生作品，全部共計 "+Tot_Len+" 個字供您檢索。"
document.all.Act.disabled=false
window.setTimeout(function(){document.all.QT.focus()},100)
}
function canclekey(){//排除掉英文特殊符號
if((event.keyCode>32 &&event.keyCode<48 )||
   (event.keyCode>57 &&event.keyCode<65 )||
   (event.keyCode>90 &&event.keyCode<97 )||
   (event.keyCode>122&&event.keyCode<128))
event.returnValue=false;
}