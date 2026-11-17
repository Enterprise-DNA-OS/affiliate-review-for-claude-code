insert into partners(id,name,owner,agreement_ref,review_on) values
('10000000-0000-4000-8000-000000000001','Kauri Guides','Mara','demo:agreement-kauri',current_date+30),
('10000000-0000-4000-8000-000000000002','Harbour Reviews','Leon','',current_date-4),
('10000000-0000-4000-8000-000000000003','Kauri Outdoors','Mara','demo:agreement-outdoors',current_date+20) on conflict do nothing;
insert into offers(id,name,owner,terms_ref) values
('20000000-0000-4000-8000-000000000001','Trail Backpack','Ana','demo:backpack-terms'),
('20000000-0000-4000-8000-000000000002','Weekend Guide','Leon','demo:guide-terms') on conflict do nothing;
insert into conversions(id,source_event_id,transaction_id,partner_id,offer_id,occurred_at,source_status,decision,currency,revenue_cents,payout_cents,sale_cents,due_on,retain_until,source_ref) values
('30000000-0000-4000-8000-000000000001','demo-event-1','demo-session-a','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',current_date-12,'approved','pending','NZD',9000,2400,25000,current_date-5,current_date+180,'demo:source-1'),
('30000000-0000-4000-8000-000000000002','demo-event-2','demo-session-a','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',current_date-10,'approved','approved','NZD',4000,1000,10000,current_date-3,current_date+180,'demo:source-2'),
('30000000-0000-4000-8000-000000000003','demo-event-3','demo-session-b','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',current_date-18,'pending','pending','AUD',1200,1800,9900,current_date-11,current_date-1,'demo:source-3'),
('30000000-0000-4000-8000-000000000004','demo-event-4','demo-session-c','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',current_date-8,'approved','approved','NZD',5000,2000,15000,current_date-1,current_date+180,'demo:source-4'),
('30000000-0000-4000-8000-000000000005','demo-event-5','demo-session-d','10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002',current_date-2,'rejected','rejected','NZD',1500,500,5000,current_date+5,current_date+180,'demo:source-5') on conflict do nothing;
insert into disclosures(id,partner_id,placement,market,outcome,evidence_ref,checked_on,review_on) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','demo:kauri-blog','NZ','clear','demo:ad-label-capture',current_date-5,current_date+25),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','demo:harbour-review','NZ','missing','demo:missing-label-capture',current_date-20,current_date-3) on conflict do nothing;
insert into disputes(id,conversion_id,reason,owner,due_on,evidence_ref) values
('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000004','Merchant reports a return; review the evidence','Leon',current_date-2,'demo:return-note') on conflict do nothing;
insert into decisions(id,conversion_id,decision,operator,reason,evidence_ref) values
('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','approved','Demo operator','Fictional verified conversion','demo:review-2'),
('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004','approved','Demo operator','Fictional initial review before dispute','demo:review-4'),
('60000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000005','rejected','Demo operator','Fictional cancelled conversion','demo:review-5') on conflict do nothing;
