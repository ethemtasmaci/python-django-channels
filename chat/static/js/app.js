// HTML'de bulunan 'room-name' ve 'user' elementlerinden verileri JSON olarak alır.
const roomName = JSON.parse(document.getElementById('room-name').textContent);
const user = JSON.parse(document.getElementById('user').textContent);

// 'hiddeninput' ID'sine sahip input alanına bir dosya seçildiğinde 'handleFileSelect' fonksiyonunu çağıracak bir olay dinleyici ekler.
document.getElementById('hiddeninput').addEventListener('change', handleFileSelect, false)

// Bu fonksiyon, kullanıcının seçtiği ilk dosyayı alır ve base64 formatına çevirmek için 'getBase64' fonksiyonunu çağırır.
function handleFileSelect() {
    var file = document.getElementById('hiddeninput').files[0];
    getBase64(file, file.type);
}

// Bu fonksiyon, dosyayı base64 formatına çevirir ve dosya tipini belirleyip WebSocket üzerinden gönderir.
function getBase64(file, filetype) {
    var type = filetype.split('/')[0]; // Dosya tipini belirler (örneğin, 'image', 'audio').
    var reader = new FileReader(); // Yeni bir FileReader nesnesi oluşturur.
    reader.readAsDataURL(file); // Dosyayı base64 formatında okur.

    reader.onload = function () {
        // Dosya yüklendiğinde, dosya tipini ve içeriğini WebSocket üzerinden gönderir.
        chatSocket.send(JSON.stringify({
            'tipi_nedir': type,
            'message': reader.result
        }));
    };
}

var isRecord = false; // Ses kaydının başlatılıp başlatılmadığını izlemek için bir bayrak.

// 'mic' ID'sine sahip mikrofon butonuna tıklandığında ses kaydını başlatır veya durdurur.
const startStop = document.getElementById('mic');

startStop.onclick = () => {
    if (isRecord) {
        // Eğer ses kaydı yapılıyorsa, kaydı durdurur.
        StopRecord();
        mic.style.color = ""; // Mikrofon simgesinin rengini varsayılan yapar.
        isRecord = false; // Kaydı durdurduğunu işaret eder.
    }
    else {
        // Eğer ses kaydı yapılmıyorsa, kaydı başlatır.
        StartRecord();
        mic.style.color = "red"; // Mikrofon simgesinin rengini kırmızı yapar.
        isRecord = true; // Kaydın başladığını işaret eder.
    }
}

// Bu fonksiyon ses kaydını başlatır ve verileri toplar.
function StartRecord() {
    navigator.mediaDevices.getUserMedia({ audio: true }) // Kullanıcının mikrofonuna erişim sağlar.
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream); // Yeni bir MediaRecorder nesnesi oluşturur.
            mediaRecorder.start(); // Kaydı başlatır.
            dataArray = []; // Kaydedilen ses verilerini tutacak bir dizi oluşturur.

            // Ses verileri kaydedildikçe bu fonksiyon çağrılır ve veriler 'dataArray' dizisine eklenir.
            mediaRecorder.ondataavailable = function (e) {
                dataArray.push(e.data);
            };

            // Kayıt durdurulduğunda bu fonksiyon çağrılır.
            mediaRecorder.onstop = function (e) {
                // Kaydedilen verilerden yeni bir Blob (ses dosyası) oluşturur.
                audioData = new Blob(dataArray, { 'type': "audio/mp3" });
                dataArray = []; // Verileri temizler.
                getBase64(audioData, audioData.type); // Ses dosyasını base64 formatına çevirip gönderir.

                // Tüm ses izlerini durdurur.
                stream.getTracks().forEach(function (track) {
                    if (track.readyState == "live" && track.kind === "audio") {
                        track.stop();
                    }
                });
            };
        });
}

// Bu fonksiyon ses kaydını durdurur.
function StopRecord() {
    mediaRecorder.stop(); // Kayıt işlemini durdurur.
}

// 'conversation' ID'sine sahip elementi alır ve bu elementin içeriğini en aşağıya kaydırır.
const conservation = document.getElementById('conversation');
conservation.scrollTop = conservation.scrollHeight;

// WebSocket bağlantısını açar, bu bağlantı üzerinden mesajlar gönderip alabilir.
const chatSocket = new WebSocket(
    'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
);

// WebSocket üzerinden bir mesaj alındığında çalışır.
chatSocket.onmessage = function (e) {
    const data = JSON.parse(e.data); // Gelen veriyi JSON formatına çevirir.
    const message_type = data.tipi_nedir; // Mesaj tipini belirler (örneğin, 'text', 'image').

    // Eğer mesaj tipi 'text' ise, mesaj içeriğini alır.
    if (message_type === "text") {
        var message = data.message;
    }
    
    // Eğer mesajı gönderen kullanıcı (user) şu anki kullanıcı ise, mesajı gönderici olarak gösterir.
    if (user == data.user) {
        var message = `<div class="row message-body">
                <div class="col-sm-12 message-main-sender">
                <div class="sender">
                    <div class="message-text">
                    ${message}
                    </div>
                    <span class="message-time pull-right">
                    ${data.date}
                    </span>
                </div>
                </div>
            </div>`;
    }
    // Aksi takdirde, mesajı alıcı olarak gösterir.
    else {
        var message = `<div class="row message-body">
                <div class="col-sm-12 message-main-receiver">
                <div class="receiver">
                    <div class="message-text">
                    ${message}
                    </div>
                    <span class="message-time pull-right">
                    ${data.date}
                    </span>
                </div>
                </div>
            </div>`;
    }

    // Mesajı 'conversation' elementinin içine ekler.
    conservation.innerHTML += message;
    // Mesaj listesini en aşağıya kaydırır.
    conservation.scrollTop = conservation.scrollHeight;
};

// WebSocket bağlantısı kapandığında çalışır.
chatSocket.onclose = function (e) {
    console.error('Chat socket closed unexpectedly'); // Hata mesajı verir.
};

// Sayfa açıldığında 'comment' ID'sine sahip input alanına odaklanır.
document.querySelector('#comment').focus();

// 'comment' alanında Enter tuşuna basıldığında mesajı göndermek için
document.querySelector('#comment').onkeyup = function (e) {
    if (e.keyCode === 13) {  // Enter tuşu basıldığında
        document.querySelector('#send').click(); // 'send' butonuna tıkla.
    }
};

// 'send' butonuna tıklandığında mesajı alır, JSON formatına çevirir ve WebSocket üzerinden gönderir.
document.querySelector('#send').onclick = function (e) {
    const messageInputDom = document.querySelector('#comment'); // 'comment' alanındaki mesajı alır.
    const message = messageInputDom.value; // Mesajın içeriğini alır.
    chatSocket.send(JSON.stringify({
        'tipi_nedir': "text", // Mesaj tipini 'text' olarak belirler.
        'message': message // Mesaj içeriğini gönderir.
    }));
    messageInputDom.value = ''; // Mesaj gönderildikten sonra input alanını temizler.
};
