/**
 * Created by lijia on 3/12/15.
 */
var UtilManagerSingleton = (function () {
  var instance;

  function createInstance() {
    var utilManager = new UtilManager();
    return utilManager;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

var UtilManager = function() {
  this.footers = [
    {
      text:'ホーム',
      iconClass:'ion-home',
      activeCss:"item-menu-active"
    },
    {
      text:'契約者情報',
      iconClass:'ion-compose',
      activeCss:""
    },
    {
      text:'調査案件',
      iconClass:'ion-levels',
      activeCss:""
    },
    {
      text:'調査報告',
      iconClass:'ion-speakerphone',
      activeCss:""
    },
    {
      text:'スケジュール',
      iconClass:'ion-clipboard',
      activeCss:""
    },
    {
      text:'マップ',
      iconClass:'ion-map',
      activeCss:""
    }
  ];

  this.reportTypes=[
    {
      value:1,
      text:'事業対応'
    },
    {
      value:2,
      text:'定期訪問'
    },
    {
      value:3,
      text: '見積もり'
    }
  ];

  this.responseTypes=[
    {
      value:1,
      text:'緊急'
    },
    {
      value:2,
      text:'通常'
    },
    {
      value: 3,
      text: '余裕あり'
    }
  ];

  this.jobEditMenus = [
    {
      index:1,
      label:'案件詳細',
      state:'assets/html/jobDetail/jobEdit/jobEditDetail.html',
      active:false
    },
    {
      index:2,
      label:'事故情報',
      state:'',
      active:false
    },
    {
      index:3,
      label:'医療調査',
      state:'assets/html/jobDetail/jobEdit/jobEditClinic.html',
      active:false
    },
    {
      index:4,
      label:'連絡関連',
      state:'',
      active:false
    },
    {
      index:5,
      label:'事案関連',
      state:'',
      active:false
    },
    {
      index:6,
      label:'就労関連',
      state:'',
      active:false
    },
    {
      index:7,
      label:'発注関連',
      state:'',
      active:false
    }
  ];
};

UtilManager.prototype.getDateString = function (date){
  
  var dateString = date.getFullYear() + "/" ;

  if (date.getMonth() + 1 >= 10){
    dateString += (date.getMonth() + 1);
  }else{
    dateString += "0" + (date.getMonth() + 1);
  }

  dateString += "/";

  if (date.getDate() >= 10){
    dateString += (date.getDate());
  }else{
    dateString += "0" + (date.getDate());
  }

  return dateString;

};
