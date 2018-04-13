;(function(global, utils) {



  var options = {
    valids: {
      /*
        valid,
        msg
      */ 
    },
    msg: {
      style: {}
    },
    realTimeCheck: false
  };
  var formEl;
  var submitBtnEl;
  var checkInputInfos = [];


  var Validator = function(form, options) {
    this.init(form, options);
  };
  


  Validator.prototype = {
    constructor: Validator,
    init: function(form, newOptions) {
      // form target 설정
      // form의 type이 어떻게 되는지 확인 후 formEl에 할당
      formEl = utils.getFormEl(form);

      // option 합치기
      utils.extendOpts(options, newOptions);

      // summit 버튼 찾기 
      // 기본적으로 submit 버튼을 찾도록 만들고 만약 없으면 메서드를 통해 추가하도록 만들자
      submitBtnEl = utils.getSubmitBtnEl();

      // data-valid 속성을 가지고 있는 태그들만 찾아 루프를 돌림.
      // data-valid 속성을 가지고 있는 태그를 찾는다.
      // 찾은 태그의 data-valid 값을 수집한다. 
      // - 그 값은 여러개의 값이 들어 올 수 있음. 
      // - 배열로 수집
      checkInputInfos = utils.getCheckInputInfos(formEl);

      // 이벤트 할당
      // target: text, select
      // text: keyup
      // select: ???
      utils.bindEvent(checkInputInfos);


      // submitBtnEl
      submitBtnEl.addEventListener('click', function() {

      });
    },
    setErrorMsg: function (target, msg){},
    setValidCondition: function (target, valid, regex){},
    setSubmitBtn: function(submitBtn) {}
  };



  var validator = new Validator('#form', {
    valids: {
      email: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
      password: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,16}$/
    }
  });



  window.Validator = Validator;

})(window, (function () {

  var messages = {
    xss: '/:?*<>"|&\\%+;를 사용할 수 없습니다.'
  }

  var hasElement = function(target) {

    if(getType(target) !== 'string') {
      console.log('string 형식의 인자만 받을 수 있습니다.');
      return false;
    }

    return document.querySelector(target) ? true : false;
  }

  var isElementNode = function(target) {

    if(getType(target).indexOf('element') === -1) {
      return false;
    }

    return target.nodeType === 1 ? true : false;
  }
  
  /**
   *
   * 외부에 노출할 함수
   *
   */
  
  var getType = function(target) {
    return Object.prototype.toString.call(target).toLowerCase().slice(8, -1);
  };

  var getFormEl = function(target) {
    
    if(!target) {
      throw 'form 입력값을 추가해주세요.';
    }

    var targetType = getType(target);
    var formRegex = /^.|^#/g; // form 태그일 때도 추가해야 함.
    var isElement = isElementNode(target);

    switch(targetType) {
      case 'string':
        if(!formRegex.test(target)) {
          throw '유효하지 않은 셀렉터입니다.';
        }

        var formEl = document.querySelector(target);

        if(!formEl) {
          throw 'element를 찾을 수 없습니다.';
        }
      
        return formEl;
      case 'object':
        if(!isElement) {
          throw 'selector 또는 elementNode만 target으로 들어올 수 있습니다.';
        }
        return target;
      default:
        throw 'selector, element 객체가 필요합니다.';
    }
  }

  var getSubmitBtnEl = function() {

    var submitBtnSelector = 'button[type="submit"]';

    return hasElement(submitBtnSelector) ? document.querySelector(submitBtnSelector) : undefined;
  }

  var checkXSS = function(target) {
    
    if(!isElementNode(target)) {
      console.error(target + '이 elementNode가 아닙니다.');
      return;
    } 

    return /[\/:?*<>"|&\\%+;']/.test(target.value) ? true : false;
  }

  var getCheckInputInfos = function(form) {
    var inputInfos = [];
    var validInputs = form.querySelectorAll('[data-valid]');

    validInputs.forEach(function(data) {
      var valids = data.getAttribute('data-valid');
      var inputInfo = {
        el: data,
        type: data.type,
        valids: valids.split(' '),
      };
      
      inputInfos.push(inputInfo);
    });

    return inputInfos;
  }

  var extendOpts = function(oldOpts, newOpts) {

    if(!newOpts) {
      return;
    }

    for(var prop in newOpts) {
      if(newOpts.hasOwnProperty(prop)) {
        if(getType(newOpts[prop]) === 'object') {

          extendOpts(oldOpts[prop], newOpts[prop]);
        } else if(getType(newOpts[prop]) === 'array') {
          
          oldOpts[prop] = newOpts[prop].slice();
        } else {
          
          oldOpts[prop] = newOpts[prop];
        }
        
      }
    }
  };

  var bindEvent = function(inputInfos) {
    
    inputInfos.forEach(function(inputInfo) {
      var type = inputInfo.type;
      var el = inputInfo.el;

      if(type === 'text') {
        el.addEventListener('keyup', keyupEvent);  
      }
    });
  };

  var keyupEvent = function(e) {
  
    if(checkXSS(e.target)) {
      alert(messages.xss);
      e.target.value = e.target.value.replace(/[\/:?*<>"|&\\%+;']/g, ''); 
      return;    
    };
  }

  return {
    getType: getType,
    getFormEl: getFormEl,
    getSubmitBtnEl: getSubmitBtnEl,
    getCheckInputInfos: getCheckInputInfos,
    extendOpts: extendOpts,
    bindEvent: bindEvent
  };

})());