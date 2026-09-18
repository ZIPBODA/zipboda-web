"""PDF 원본의 관찰한 세대 영역만 내보낸다. 좌표는 1.3배 검토 이미지 기준이며 모델 좌표가 아니다."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tmp/pdf-tools"))
import pymupdf
from PIL import Image, ImageDraw

REVIEW_SCALE = 1.3
EXPORT_SCALE = 4

def rectangle(x0, y0, x1, y1):
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

def prepare():
    sources = sorted((ROOT / "public/reference").glob("*.pdf"))
    definitions = [
        ("gangnam-gaepo", "강남개포동(T&K개포)", "서울특별시 강남구 논현로12길 23-5(개포동,T&K개포) T&K개포", "LH", 13, "도시형생활주택", 0),
        ("gangseo-hwagok", "강서화곡동", "서울특별시 강서구 초록마을로12길 20(화곡동)", None, 9, "다가구주택", 1),
        ("gwanak-sillim", "관악신림동2", "서울특별시 관악구 대학2길 6(신림동)", None, 13, "다가구주택", 2),
        ("dobong-banghak", "도봉방학동", "서울특별시 도봉구 도당로13다길 15-7(방학동)", None, 10, "다가구주택", 3),
        ("seocho-iris", "서초서초동(아이리스예당)", "서울특별시 서초구 남부순환로315길 34-9(서초동)", None, 20, "도시형생활주택(원룸형)", 4),
        ("seongdong-yongdap", "성동용답동(더위일스카이70)", "서울특별시 성동구 자동차시장1길 31(용답동) THE WEAL SKY70", None, None, None, 5),
        ("songpa-ogeum", "송파오금동(더트라이앵글)", "서울특별시 송파구 마천로8길 19-12(오금동) 더트라이앵글", "LH", 14, None, 6),
        ("jungnang-myeonmok", "중랑면목동", "서울특별시 중랑구 면목천로23길 52(면목동)", None, 12, "다가구주택", 7),
        ("jungnang-muk", "중랑묵동", "서울특별시 중랑구 동일로149가길 21(묵동) 묵동 245-39", None, None, None, 8),
    ]
    properties = []
    for id, title, address, agency, households, housing_type, index in definitions:
        expected = ["강남구", "강서구", "관악구", "도봉구", "서초구", "성동구", "송파구", "면목동", "묵동"][index]
        source = next(f for f in sources if expected in f.name)
        properties.append(dict(id=id, title=title, address=address, agency=agency, households=households, housingType=housing_type,
            sourcePdf="/reference/" + source.name, sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(), image=None, layouts=[], issues=[]))
    def add(index, floor, unit, area, page, polygon, dimension=None, type=None, balcony=None, issue=None):
        p = properties[index]
        key = f"{p['id']}-{floor}-{unit}"
        p['layouts'].append(dict(layoutKey=key, unitKey=key, floor=floor, unit=unit, type=type, exclusiveAreaM2=area,
            balconyAreaM2=balcony, page=page, cropPolygon=polygon, calibration=dimension,
            image2dUrl=f"/housing/{p['id']}/{key}.png", modelStatus="pending-review", issue=issue))

    # 같은 면적과 거울상 구조를 자동으로 동일 layout으로 합치지 않는다.
    for unit, area, poly in [
        ('01',28.81,[[179,413],[274,413],[274,493],[317,493],[317,639],[179,639]]),
        ('02',31.99,[[179,325],[394,325],[394,499],[268,499],[268,423],[179,423]]),
        ('03',31.99,[[389,325],[600,325],[600,423],[505,423],[505,499],[389,499]]),
        ('04',28.81,[[505,413],[600,413],[600,639],[460,639],[460,493],[505,493]])]:
        add(0,'2-3',unit,area,2,poly,[3000,86])
    add(0,'4','401',30.76,2,[[953,392],[1048,392],[1048,493],[1092,493],[1092,639],[953,639]],[3000,86])
    add(0,'4','402',26.99,2,rectangle(1039,392,1285,499),[6000,173])
    add(0,'4','403',30.76,2,[[1278,392],[1375,392],[1375,639],[1237,639],[1237,493],[1278,493]],[3000,86])
    add(0,'5','501',31.64,3,[[179,392],[395,392],[395,466],[318,466],[318,605],[179,605]],[6000,172],balcony=4.24)
    add(0,'5','502-drawing',None,3,[[389,392],[601,392],[601,605],[461,605],[461,466],[389,466]],[6300,181],issue='도면 502호 / 면적표 503호(32.91㎡, 확장 3.08㎡): 대응 미확정')

    for unit, x, area, typ, y0, y1 in [('201',191,14.69,'A',551,779),('202',323,14.69,'A',551,779),('203',191,15.68,'B',317,512),('204',323,15.68,'B',317,512),('205',444,15.68,'B',317,512)]:
        add(1,'2',unit,area,2,rectangle(x,y0,{'201':332,'202':463,'203':331,'204':453,'205':585}[unit],y1),[3300,122],typ)
    for unit,x in [('301',964),('302',1097)]: add(1,'3',unit,14.69,2,rectangle(x,551,x+141,779),[3300,122],'A')
    for unit,x in [('401',191),('402',323)]: add(1,'4',unit,14.69,3,rectangle(x,551,x+141,779),[3300,122],'A')

    for unit,typ,area,poly in [
        ('01','가',15.3,rectangle(185,489,307,675)),('02','다',17.16,rectangle(185,332,394,445)),
        ('03','나',14.85,rectangle(381,489,491,675)),('04','나',14.85,rectangle(482,489,595,675)),
        ('05','다',17.16,rectangle(389,332,595,445))]: add(2,'2-3',unit,area,2,poly,[3300,100],typ)
    add(2,'4','401',17.64,2,[[960,445],[1027,445],[1027,488],[1078,488],[1078,675],[960,675]],[3300,100],'라')
    add(2,'4','402',14.85,2,rectangle(1152,489,1261,675),[3300,100],'나')
    add(2,'4','403',17.06,2,[[1302,445],[1366,445],[1366,675],[1254,675],[1254,489],[1302,489]],[3300,100],'마')

    add(3,'2-3','01',13.66,2,rectangle(289,600,495,748),[3600,133],'A',4.32)
    for unit,x in [('02',448),('03',314),('04',175)]: add(3,'2-3',unit,13.86,2,rectangle(x,347,x+146,558),[3600,133],'B',4.32)
    for unit,y in [('401',600),('402',463)]: add(3,'4',unit,13.66,2,rectangle(1061,y,1267,y+147),[3600,133],'A',4.32)

    # 도면은 있으나 실측 근거가 없어 스케일을 추정하지 않는다.
    seocho=[
        ('2-3','01',[[280,301],[398,301],[398,326],[429,326],[429,396],[280,396]]),
        ('2-3','02',rectangle(280,202,398,305)),
        ('2-3','03',[[280,136],[454,136],[454,259],[392,259],[392,207],[280,207]]),
        ('2-3','04',[[453,136],[603,136],[603,200],[530,200],[530,229],[508,229],[508,259],[453,259]]),
        ('2-3','05',[[530,194],[603,194],[603,306],[508,306],[508,225],[530,225]]),
        ('2-3','06',[[510,301],[603,301],[603,368],[575,396],[480,396],[480,326],[510,326]]),
        ('4','01',[[304,513],[364,513],[364,582],[398,582],[398,635],[429,635],[429,702],[304,702]]),
        ('4','02',[[304,450],[455,450],[455,563],[429,563],[429,587],[360,587],[360,518],[304,518]]),
        ('4','03',[[452,450],[603,450],[603,519],[550,519],[550,585],[480,585],[480,563],[452,563]]),
        ('4','04',[[547,514],[603,514],[603,670],[573,702],[480,702],[480,635],[510,635],[510,580],[547,580]]),
        ('5','01',[[309,836],[382,836],[382,943],[412,943],[412,1016],[309,1016]]),
        ('5','02',[[309,755],[446,755],[446,861],[416,861],[416,890],[378,890],[378,841],[309,841]]),
        ('5','03',[[443,755],[603,755],[603,841],[508,841],[508,890],[477,890],[477,861],[443,861]]),
        ('5','04',[[505,836],[603,836],[603,985],[573,1016],[477,1016],[477,943],[510,943]])]
    for floor,unit,poly in seocho: add(4,floor,unit,None,2,poly,issue='전용면적·실측 치수 없음: 2D 전용')

    for unit,area,typ,poly in [
        ('1',34.98,'A',[[391,653],[555,682],[527,844],[363,816]]),
        ('2',34.78,'B',[[181,628],[343,655],[313,834],[229,819],[234,793],[153,779]]),
        ('4',34.98,'A',[[243,267],[408,296],[381,457],[216,429]])]:
        add(5,'3-15',unit,area,1,poly,[3000,79.3],typ,issue='치수 체인(3,200+3,000 / 3,100+3,200)과 크롭 실측 외곽이 2~4% 불일치, 회전·저해상 스캔: 3D 트레이싱 보류')
        properties[5]['layouts'][-1]['rotationDegrees']=9.9
    properties[5]['issues'].append('공급기관·전체 세대 수 미확인. 호수별 구조가 회전·반전되어 A타입도 별도 layout 유지')

    for unit,area,poly in [
        ('01',24.43,[[481,499],[656,499],[656,622],[436,622],[436,542],[481,542]]),
        ('02',23.265,[[486,381],[656,381],[656,504],[481,504],[481,466],[436,466],[436,394],[486,394]]),
        ('03',23.225,[[171,393],[365,393],[365,463],[321,463],[321,518],[147,518],[147,452],[171,452]]),
        ('04',22.86,[[126,509],[321,509],[321,549],[360,549],[360,622],[126,622]])]: add(6,'2-3',unit,area,2,poly,[5100,153])
    add(6,'4','401',23.43,2,[[1255,499],[1428,499],[1428,622],[1208,622],[1208,542],[1255,542]],[5100,153])
    add(6,'4','402',23.265,2,[[1258,381],[1428,381],[1428,504],[1255,504],[1255,466],[1208,466],[1208,394],[1258,394]],[5100,153])
    add(6,'4','403',24.585,2,[[1023,393],[1136,393],[1136,622],[968,622],[968,524],[998,524],[998,453],[1023,453]],[5100,153],balcony=6.22)
    add(6,'5','501',23.43,3,[[447,499],[623,499],[623,622],[402,622],[402,542],[447,542]],[5100,154])
    add(6,'5','502',23.265,3,[[451,381],[623,381],[623,504],[447,504],[447,466],[402,466],[402,394],[451,394]],[5100,154])
    add(6,'5','503',23.445,3,[[253,392],[336,392],[336,465],[325,465],[325,622],[196,622],[196,544]],[3900,117],issue='대각 외벽: 직교 추출 결과 검수 필수')
    properties[6]['issues'].append('1쪽 다세대주택 / 2~3쪽 비고 도시형생활주택: 주택유형 미확정')

    for unit,area,poly,balcony in [('01',14.6475,rectangle(213,266,347,495),3.78),('02',14.6475,rectangle(425,266,559,495),3.78),('03',14.64,rectangle(435,544,559,776),3.66),('04',14.64,rectangle(328,544,443,776),3.66),('05',14.64,rectangle(213,544,336,776),3.66)]: add(7,'2-3',unit,area,2,poly,[3150,110],balcony=balcony)
    add(7,'4','01-drawing',None,2,rectangle(1207,338,1334,656),[3150,110],issue='도면 1호는 분홍색, 표 401호는 파란색: 전용면적 대응 미확정')
    add(7,'4','02-drawing',None,2,[[1097,547],[1218,547],[1218,649],[1334,649],[1334,776],[1097,776]],[3050,107],issue='도면 2호는 파란색, 표 402호는 분홍색: 전용면적 대응 미확정')
    properties[8]['issues'].append('사용자 주소 묵동 245-39 / PDF 본문 묵동 173-27: 동일 주택 확인 전 사진·도면 연결 보류')

    # 내보내기 전에 원본과 연결되는 기계 판독 inventory를 남긴다.
    target=ROOT/'src/shared/api/housing-data'; target.mkdir(parents=True,exist_ok=True)
    for p in properties:
        doc=pymupdf.open(ROOT/'public'/p['sourcePdf'].lstrip('/'))
        asset_dir=ROOT/'public/housing'/p['id']; asset_dir.mkdir(parents=True,exist_ok=True)
        for layout in p['layouts']:
            page=doc[layout['page']-1]
            points=layout['cropPolygon']
            bounds=[min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)]
            clip=pymupdf.Rect(*(v/REVIEW_SCALE for v in bounds))
            pix=page.get_pixmap(matrix=pymupdf.Matrix(EXPORT_SCALE,EXPORT_SCALE),clip=clip,alpha=False)
            image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
            mask=Image.new('L',image.size,0)
            ImageDraw.Draw(mask).polygon([((x-bounds[0])*EXPORT_SCALE/REVIEW_SCALE,(y-bounds[1])*EXPORT_SCALE/REVIEW_SCALE) for x,y in points],fill=255)
            clean=Image.new('RGB',image.size,'white'); clean.paste(image,mask=mask)
            if layout.get('rotationDegrees'): clean=clean.rotate(layout['rotationDegrees'],resample=Image.Resampling.BICUBIC,expand=True,fillcolor='white')
            clean.save(ROOT/'public'/layout['image2dUrl'].lstrip('/'))
            layout['mmPerPx']=layout['calibration'][0]/layout['calibration'][1]*REVIEW_SCALE/EXPORT_SCALE if layout['calibration'] else None
        if p['id'] not in ['seongdong-yongdap','jungnang-muk']:
            # 각 PDF 1쪽에서 실제 외관 사진의 대표 영역만 사용한다.
            photo=(828,208,1170,635) if p['id']=='seocho-iris' else ((825,280,1260,839) if p['id'] in ['gangnam-gaepo','songpa-ogeum'] else (825,160,1240,590))
            pix=doc[0].get_pixmap(matrix=pymupdf.Matrix(2,2),clip=pymupdf.Rect(*(v/REVIEW_SCALE for v in photo)))
            pix.save(str(asset_dir/'exterior.png')); p['image']=f"/housing/{p['id']}/exterior.png"
    (target/'catalog.json').write_text(json.dumps(properties,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"{len(properties)} properties, {sum(len(p['layouts']) for p in properties)} layout crops")

if __name__=='__main__':
    prepare()
