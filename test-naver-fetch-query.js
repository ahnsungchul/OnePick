async function test() {
   const url = "https://postfiles.pstatic.net/MjAyNTExMjBfMTk3/MDAxNzYzNjI2OTg1NDg0.UpA8WBnXBsOE7hLwUyMB_cKz5-mTIx4h1QFEdrLUsFwg.mIIfFH-MG8Cis0iAWKLQ7KAqXOEfmNRkV94RtrDtoosg.JPEG/KakaoTalk_20251120_170927667.jpg?type=w386";
   
   console.log("Fetching normal...");
   const r1 = await fetch(url);
   console.log("Normal:", r1.status);

   console.log("Fetching with onepick_cb...");
   const r2 = await fetch(url + '&onepick_cb=1234');
   console.log("With CB:", r2.status);
}
test();
