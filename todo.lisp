;;加载基础需求
;;If Windows,在sbcl启动的bat里设置 chcp 65001
;;(load "~/quicklisp/setup.lisp")
(setf sb-impl::*default-external-format* :UTF-8)
(ql:quickload '(hunchentoot clsql clsql-sqlite3 cl-json))

;;复写encode-json
(in-package :json)
#+cl-json-clos
(defmethod encode-json ((o clsql-sys::standard-db-object)
                        &optional (stream *json-output*))
  "Write the JSON representation (Object) of the STANDARD-DB-OBJECT O to
STREAM (or to *JSON-OUTPUT*)."
  (with-object (stream)
			   (map-slots (lambda(key value)
							(if (not (equal key 'clsql-sys::view-database))
								(as-object-member (key stream)
												  (encode-json value stream)))) o)))

(defpackage todo
  (:use :cl :hunchentoot :clsql :json))
(in-package :todo)
(start (make-instance 'hunchentoot:easy-acceptor :port 8082))
;;数据库设置
(connect "todo.db" :database-type :sqlite3)
(locally-enable-sql-reader-syntax)
(setf *default-caching* nil)
(defvar *page-size* 10)
;;建表
(drop-table [item] :if-does-not-exist :ignore)
(drop-table [setting] :if-does-not-exist :ignore)


;;对象定义部分
(def-view-class setting()
  ((key :accessor key
		:db-kind :key
		:db-constraints :not-null
		:type (string 30)
		:initarg :key)
   (value :accessor value
		  :db-constraints :not-null
		  :type (string 500)
		  :initarg :value)))
(create-view-from-class 'setting)

(def-view-class item()
  ((id :reader id
       :db-kind :key
       :db-constraints :not-null
       :type integer
       :initarg :id)
   (content :accessor content
			:db-constraints :not-null
			:type (string 500)
			:initarg :content)
   (people :accessor people
		   :db-constraints :not-null
		   :type (string 30)
		   :initarg :people)
   (state :accessor state
		  :db-constraints :not-null
		  :type integer
		  :initform 1)
   (atime :accessor atime
		  :type integer
		  :initform (get-universal-time))))
(create-view-from-class 'item)


;;LOGIC ====== 业务方法
(defmethod gen-last-item-id()
  (let ((count-setting (car (first (select 'setting :where [= [slot-value 'setting 'key] "item-count"])))) (count 1))
    (if count-setting 
		(setf count (+ 1 (parse-integer (value count-setting)))))
    (update-items-count count)
    count
    ))
(defmethod update-items-count(count)
  (let ((count-setting (car (first (select 'setting :where [= [slot-value 'setting 'key] "item-count"])))))
    (if count-setting
		(setf (value count-setting) (write-to-string count))
      (setf count-setting (make-instance 'setting :key "item-count" :value (write-to-string count))))
    (update-records-from-instance count-setting)))


(defmethod close-item(id)
  "关闭任务"
  (update-records [item] 
				  :av-pairs'((state 0))
				  :where [= [id] id]))

(defmethod open-item(id)
  "开启任务"
  (update-records [item] 
				  :av-pairs'((state 1))
				  :where [= [id] id]))

(defmethod add-item(people content)
  "新增任务"
  (update-records-from-instance (make-instance 'item :people people :content content :id (gen-last-item-id))))

(defmethod update-item(id people content)
  "更新任务"
  (update-records [item] 
				  :av-pairs `((people ,people)
							 (content ,content))
				  :where [= [id] id]))

(defmethod todos()
  "所有未完成"
  (mapcar #'car
		  (select 'item 
				  :where [= [state] 1]
				  :order-by '(([id] :desc) ([atime] :desc)))))

(defmethod items(&key (page 1) (state nil))
  "任务列表 - 全部"
  (if (eq page nil)
      (setf page 1)
    (setf page (parse-integer page)))
  (mapcar #'car 
		  (if state
			  (select 'item 
					  :where [= [state] state] 
					  :order-by '(([id] :desc) ([atime] :desc))
					  :limit *page-size*
					  :offset (* (- page 1) *page-size*))
			(select 'item 
					:order-by  '(([id] :desc) ([atime] :desc))
					:limit *page-size*
					:offset (* (- page 1) *page-size*)))))

(defmethod item-by-id(id)
  "根据ID查询单个任务"
  (car (first (select 'item :where [= [id] id]))))



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
  (let ((people (post-parameter "people")) (content (post-parameter "content")))
    (add-item people content)))

(defmethod controller-item-update()
  "修改任务"
  (let ((people (post-parameter "people"))
		(content (post-parameter "content"))
		(id (post-parameter "id")))
    (update-item id people content)))

(defmethod handle-request :before ((acceptor acceptor) (request request))
  "登录"
  (let ((username (nth-value 0 (authorization)))
		(password (nth-value 1 (authorization))))
	(if (not (and (equal username "jjj")
				  (equal password "jjj")))
		(require-authorization))))


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
       (create-folder-dispatcher-and-handler "/static/" #p"./static/")
       (create-folder-dispatcher-and-handler "/dynamic/" #p"./dynamic/")
       ))





;;示例数据
(add-item "張三" "检查Android程序健壮性")
(add-item "李四" "检查油库程序接口可靠性")
(add-item "王五" "检查云端程序可靠性")
(add-item "趙六" "编写TODO程序")

(fmakunbound 'itessms)
