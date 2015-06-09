;;加载基础需求
;;If Windows,在sbcl启动的bat里设置 chcp 65001
;;(load "~/quicklisp/setup.lisp")
(setf sb-impl::*default-external-format* :UTF-8)
(ql:quickload '(hunchentoot cl-json cl-prevalence))

(in-package :cl-prevalence)
(defgeneric find-objects-with-slot (system class slot value &optional test)
  (:documentation "Find and return the object in system of class with slot equal to value, null if not found"))
;;批量查询方法
(defmethod find-objects-with-slot ((system prevalence-system) class slot value &optional (test #'equalp))
  "Find and return the object in system of class with slot equal to value, null if not found"
  (let* ((result))
	(loop :for object :in (find-all-objects system class)
	   :do (when (funcall test value (slot-value object slot))
			 (push object result)))
	result))
(export 'find-objects-with-slot)

(defpackage todo
  (:use :cl :hunchentoot :json))
(in-package :todo)



;;时间转换 http://lisptips.com/post/11649360174/the-common-lisp-and-unix-epochs
(defvar *unix-epoch-difference*
  (encode-universal-time 0 0 0 1 1 1970 0))
(defun universal-to-unix-time(universal-time)
  (- universal-time *unix-epoch-difference*))
(defun unix-to-universal-time(unix-time)
  (+ unix-time *unix-epoch-difference*))
(defun get-unix-time()
  (universal-to-unix-time (get-universal-time)))

(defmethod handle-request :before ((acceptor acceptor) (request request))
  "登录"
  (let ((username (nth-value 0 (authorization)))
		(password (nth-value 1 (authorization))))
	(If (not (and (equal username "yhtzd")
				  (equal password "sxpm")))
		(require-authorization))))


(defvar *page-size* 10)


;;对象定义部分
(defclass setting()
  ((id :accessor id
	   :initarg :id)
   (key :accessor key
		:initarg :key)
   (value :accessor value
		  :initarg :value)))

(defclass item()
  ((id :reader id
       :initarg :id)
   (content :accessor content
			:initarg :content)
   (people :accessor people
		   :initarg :people)
   (state :accessor state
		  :initform 1)
   (atime :accessor atime
		  :initform (get-unix-time))
   (days :accessor days
		 :initarg :days)))


;;初始化存储
(setf *p-system* (cl-prevalence:make-prevalence-system #p"./p-system/"))
;;当存储为空时,初始化
(or (> (length (cl-prevalence:find-all-objects *p-system* 'item)) 0)
	(cl-prevalence:tx-create-id-counter *p-system*))


;;启动服务
(setf *show-lisp-errors-p* t)
(setf *acceptor* (make-instance 'hunchentoot:easy-acceptor 
								:port 8082 
								:access-log-destination "log/access.log"
								:message-log-destination "log/message.log"
								:error-template-directory  "www/errors/"
								:document-root "www/"))
(start *acceptor*)



(defmethod close-item(id)
  "关闭任务"
  (and (stringp id) (setf id (parse-integer id)))
  (cl-prevalence:tx-change-object-slots *p-system* 'item id
										`((state 0))))

(defmethod open-item(id)
  "开启任务"
  (and (stringp id) (setf id (parse-integer id)))
  (cl-prevalence:tx-change-object-slots *p-system* 'item id
										`((state 1))))

(defmethod add-item(people content days)
  "新增任务"
  (cl-prevalence:tx-create-object *p-system* 'item
								  `((people ,people)
									(content ,content)
									(days ,days))) "OK")

(defmethod update-item(id people content days)
  "更新任务"
  (and (stringp id) (setf id (parse-integer id)))
  (cl-prevalence:tx-change-object-slots *p-system* 'item id
										`((people ,people)
										  (content ,content)
										  (days ,days))))

(defmethod todos()
  "所有未完成"
  (sort
   (copy-list
	(cl-prevalence:find-objects-with-slot *p-system* 'item 'state 1))
   #'> :key 'id))

(defmethod items(&key (page "1") (state nil))
  "任务列表 - 全部"
  (let* ((page (if (eq page nil) 1 (parse-integer page)))
		 (objects (sort (copy-list (if state
									   (cl-prevalence:find-objects-with-slot *p-system* 'item 'state state)
									   (cl-prevalence:find-all-objects *p-system* 'item))) #'> :key 'id))
		 (start (* (- page 1) *page-size*))
		 (end (+ start *page-size*))
		 (total (length objects)))
	(subseq objects  (if (> start total) total start) (if (> end total) total end))))

(defmethod item-by-id(id)
  "根据ID查询单个任务"
  (cl-prevalence:find-object-with-id *p-system* 'item id))



;;CONTROLLER ====== 请求处理部分
(defmethod controller-index()
  (redirect "/dynamic/index.html"))

(defmethod controller-item()
  "根据任务ID精确查询"
  (setf (content-type*) "application/json")
  (let ((id (get-parameter "id")))
    (encode-json-to-string (item-by-id id))))

(defmethod controller-item-open()
  "打开任务"
  (let ((id (post-parameter "id")))
    (open-item id)))

(defmethod controller-item-close()
  "关闭任务"
  (let ((id (post-parameter "id")))
    (close-item id)))

(defmethod controller-items()
  "任务列表-分页"
  (setf (content-type*) "application/json")
  (let ((state (get-parameter "state"))
		(page (get-parameter "page")))
    (encode-json-to-string (items 
							:state state 
							:page page))))

(defmethod controller-todos-all()
  "所有未完成任务"
  (setf (content-type*) "application/json")
  (encode-json-to-string (todos)))

(defmethod controller-items-add()
  "新增任务"
  (let ((people (post-parameter "people")) (content (post-parameter "content")) (days (post-parameter "days")))
    (add-item people content (parse-integer days))))


(defmethod controller-item-update()
  "修改任务"
  (let ((people (post-parameter "people"))
		(content (post-parameter "content"))
		(id (post-parameter "id"))
		(days (post-parameter "days")))
    (update-item id people content (parse-integer days))))



;;设置dispatch-table
(setf *dispatch-table*
      (list
       (create-regex-dispatcher "^/$" 'controller-index)
       (create-regex-dispatcher "^/items$" 'controller-items)
       (create-regex-dispatcher "^/todos$" 'controller-todos-all)
       (create-regex-dispatcher "^/items/add" 'controller-items-add)
       (create-regex-dispatcher "^/item$" 'controller-item)
       (create-regex-dispatcher "^/item/open$" 'controller-item-open)
       (create-regex-dispatcher "^/item/close$" 'controller-item-close)
       (create-regex-dispatcher "^/item/update$" 'controller-item-update)
       (create-folder-dispatcher-and-handler "/static/" #p"static/")
       (create-folder-dispatcher-and-handler "/dynamic/" #p"dynamic/")
       ))



;;示例数据
(add-item "張三" "检查Android程序健壮性" 2)
(add-item "李四" "检查油库程序接口可靠性" 3)
(add-item "王老五" "检查云端程序可靠性" 3)
(add-item "趙六" "编写TODO程序" 3)

;;(fmakunbound 'itessms)

;;(query "alter table item add DAYS integer")
