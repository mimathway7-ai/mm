# تقرير تنظيف بنية مشروع Qoffa Smart

## النتيجة

تم تنظيم صفحات المشروع لاستخدام **clean URLs** متوافقة مع GitHub Pages، مع الحفاظ على التصميم والمحتوى والوظائف الحالية. أصبحت الصفحات المستقلة داخل مجلدات تحمل أسماء المسارات، وكل مجلد يحتوي على `index.html`.

## البنية الجديدة

```text
index.html
products/index.html
about/index.html
contact/index.html
bundles/index.html
order/index.html
product-detail/index.html
return-policy/index.html
terms/index.html
assets/css/...
assets/js/...
assets/images/...
manifest.json
service-worker.js
```

## الملفات المنقولة

| الملف السابق | المسار الجديد |
|---|---|
| `products.html` | `products/index.html` |
| `about.html` | `about/index.html` |
| `contact.html` | `contact/index.html` |
| `bundles.html` | `bundles/index.html` |
| `order.html` | `order/index.html` |
| `product-detail.html` | `product-detail/index.html` |
| `return-policy.html` | `return-policy/index.html` |
| `terms.html` | `terms/index.html` |

## المراجع التي تم تحديثها

تم تحديث روابط التنقل، الـnavbar، القوائم المحمولة، روابط الـfooter، أزرار الانتقال، وعمليات `window.location.href` إلى المسارات النظيفة مثل `/products/` و`/order/` و`/product-detail/?id=...`. كما تم إصلاح مسارات CSS وJavaScript والصور والخطوط داخل الصفحات المنقولة بإضافة `../` عند الحاجة، وتوحيد المسارات الديناميكية للصور في JavaScript لتبدأ من `/assets/`.

تم تحديث `manifest.json` إلى المسارات النظيفة، وتحديث `service-worker.js` ليستخدم صفحات المجلدات الجديدة، مع إضافة مساري `/bundles/` و`/product-detail/` إلى قائمة الصفحات المخزنة. تم كذلك إعادة تسمية `assets/js/REORDER_SYSTEM_INFO.js` إلى `assets/js/reorder-system-info.js` وتحديث مراجعه.

## CSS وJavaScript والـassets

أسماء ملفات CSS الحالية descriptive ومتخصصة وتُستخدم كطبقات تصميم متعددة، لذلك لم تتم إعادة تسميتها جماعياً حتى لا يتغير ترتيب الـcascade أو التصميم. أبقيت كذلك أسماء assets الوصفية الحالية كما هي. لم يتم حذف أي ملف. أُضيف `assets/images/default.png` كنسخة fallback من `logo.png` لأن JavaScript كان يشير إليه وكان غير موجود، وذلك لمنع صورة مفقودة أثناء fallback.

## نتائج التدقيق

تم التحقق من وجود صفحات `index.html` لجميع المسارات النظيفة، وعدم وجود مراجع تشغيلية قديمة إلى صفحات `.html` في HTML أو JavaScript أو JSON أو XML، وصحة صياغة ملفات JavaScript عبر `node --check`، وصحة `manifest.json` كملف JSON. لا يوجد في النسخة الأصلية `sitemap.xml` أو `robots.txt`؛ لذلك لم يكن هناك ملف يحتاج إلى تحديث.

## ملاحظات يدوية

المسارات التي تبدأ بشرطة مائلة مثل `/products/` مناسبة للنشر على custom domain مثل `www.qoffasmart.ma`. إذا كان الموقع سيُنشر داخل **subpath** على GitHub Pages بدلاً من custom domain، فيجب استبدال المسارات المطلقة بإضافة اسم المستودع أو ضبط `base path` وفق إعداد النشر.

ملفات CSS التي تحمل suffixes مثل `-v2` و`-v3` بقيت دون تغيير لأنها تمثل طبقات/نسخاً مستخدمة فعلياً، وإعادة تسميتها ليست ضرورية لتحقيق clean URLs وقد تؤثر على ترتيب التحميل أو الصيانة البصرية.
