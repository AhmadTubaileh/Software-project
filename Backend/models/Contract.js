const db = require('../config/database');
const { compressImageBuffer } = require('../middleware/upload');

class Contract {
  // ⭐ NEW: Helper function to safely insert sponsor with compressed image
  static insertSponsorSafely(contractId, sponsor, index) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🔄 Processing sponsor ${index + 1}: ${sponsor.full_name || 'Unknown'}`);
        
        // Compress image if exists
        let compressedImage = null;
        let imageBuffer = null; // Declare outside try block for catch block access
        
        if (sponsor.id_card_image) {
          try {
            // Handle different image formats
            
            if (Buffer.isBuffer(sponsor.id_card_image)) {
              // Already a Buffer (from multer file upload)
              console.log(`📸 Sponsor ${index + 1}: Image is Buffer (${Math.round(sponsor.id_card_image.length / 1024)}KB)`);
              imageBuffer = sponsor.id_card_image;
            } else if (typeof sponsor.id_card_image === 'string') {
              // Base64 string - convert to Buffer
              console.log(`📸 Sponsor ${index + 1}: Image is string, converting to Buffer...`);
              if (sponsor.id_card_image.startsWith('data:')) {
                // Extract base64 from data URL
                const base64Data = sponsor.id_card_image.split(',')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
              } else {
                // Assume it's already base64
                imageBuffer = Buffer.from(sponsor.id_card_image, 'base64');
              }
              console.log(`📸 Sponsor ${index + 1}: Converted to Buffer (${Math.round(imageBuffer.length / 1024)}KB)`);
            } else {
              console.log(`⚠️ Sponsor ${index + 1}: Unknown image type: ${typeof sponsor.id_card_image}`);
              imageBuffer = null;
            }
            
            // Compress the image if we have a valid buffer
            if (imageBuffer && imageBuffer.length > 0) {
              console.log(`🔄 Sponsor ${index + 1}: Compressing image...`);
              try {
                // Add timeout to prevent hanging (10 seconds max)
                const compressionPromise = compressImageBuffer(imageBuffer);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Compression timeout after 10 seconds')), 10000)
                );
                compressedImage = await Promise.race([compressionPromise, timeoutPromise]);
              } catch (compressionError) {
                console.error(`⚠️ Sponsor ${index + 1}: Compression error:`, compressionError.message);
                compressedImage = imageBuffer; // Use original on error
              }
              
              if (compressedImage && compressedImage.length > 0) {
                console.log(`✅ Sponsor ${index + 1}: Compressed image to ${Math.round(compressedImage.length / 1024)}KB`);
              } else {
                console.log(`⚠️ Sponsor ${index + 1}: Compression returned null/empty, using original`);
                compressedImage = imageBuffer; // Use original if compression fails
              }
            } else {
              console.log(`⚠️ Sponsor ${index + 1}: No valid image buffer to compress`);
              compressedImage = null;
            }
          } catch (imageError) {
            console.error(`❌ Sponsor ${index + 1}: Image processing failed:`, imageError.message);
            console.error(`❌ Sponsor ${index + 1}: Error stack:`, imageError.stack);
            // Try to use original if available
            if (imageBuffer && imageBuffer.length > 0) {
              compressedImage = imageBuffer;
              console.log(`🔄 Sponsor ${index + 1}: Using original Buffer after error`);
            } else if (Buffer.isBuffer(sponsor.id_card_image)) {
              compressedImage = sponsor.id_card_image;
              console.log(`🔄 Sponsor ${index + 1}: Using original sponsor.id_card_image after error`);
            } else {
              compressedImage = null;
            }
          }
        } else {
          console.log(`ℹ️ Sponsor ${index + 1}: No image provided`);
        }
        
        // Log final image status before database operation
        if (compressedImage) {
          console.log(`💾 Sponsor ${index + 1}: Ready to save image (${Math.round(compressedImage.length / 1024)}KB)`);
        } else {
          console.log(`💾 Sponsor ${index + 1}: No image to save`);
        }
        
        // Check if sponsor already exists
        const checkQuery = `
          SELECT id FROM contract_sponsors 
          WHERE contract_id = ? AND id_card_number = ?
        `;
        
        db.query(checkQuery, [contractId, sponsor.id_card_number], (checkErr, checkResults) => {
          if (checkErr) {
            console.error(`❌ Sponsor ${index + 1}: Check error:`, checkErr.message);
            // Continue anyway
            return insertSponsor();
          }
          
          if (checkResults.length > 0) {
            // Update existing sponsor
            const updateQuery = `
              UPDATE contract_sponsors 
              SET full_name = ?, phone = ?, relationship = ?, address = ?, 
                  id_card_image = COALESCE(?, id_card_image)
              WHERE contract_id = ? AND id_card_number = ?
            `;
            
            // Log what we're about to update
            console.log(`💾 Sponsor ${index + 1}: Updating with image: ${compressedImage ? `YES (${Math.round(compressedImage.length / 1024)}KB)` : 'NO (keeping existing)'}`);
            
            db.query(updateQuery, [
              sponsor.full_name,
              sponsor.phone,
              sponsor.relationship || '',
              sponsor.address,
              compressedImage,
              contractId,
              sponsor.id_card_number
            ], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Sponsor ${index + 1}: Update error:`, updateErr.message);
                // Try without image
                return insertSponsorWithoutImage();
              }
              console.log(`✅ Sponsor ${index + 1}: Updated successfully`);
              resolve({ success: true, action: 'updated' });
            });
          } else {
            insertSponsor();
          }
        });
        
        function insertSponsor() {
          const insertQuery = `
            INSERT INTO contract_sponsors 
            (contract_id, full_name, phone, id_card_number, relationship, address, id_card_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          // Log what we're about to insert
          console.log(`💾 Sponsor ${index + 1}: Inserting with image: ${compressedImage ? `YES (${Math.round(compressedImage.length / 1024)}KB)` : 'NO'}`);
          
          db.query(insertQuery, [
            contractId,
            sponsor.full_name,
            sponsor.phone,
            sponsor.id_card_number,
            sponsor.relationship || '',
            sponsor.address,
            compressedImage
          ], (insertErr) => {
            if (insertErr) {
              console.error(`❌ Sponsor ${index + 1}: Insert error:`, insertErr.message);
              
              // If packet too large, try without image
              if (insertErr.code === 'ER_NET_PACKET_TOO_LARGE' || insertErr.errno === 1153) {
                console.log(`🔄 Sponsor ${index + 1}: Packet too large, trying without image...`);
                return insertSponsorWithoutImage();
              }
              
              // For foreign key errors, contract might not exist
              if (insertErr.code === 'ER_NO_REFERENCED_ROW_2' || insertErr.errno === 1452) {
                console.error(`❌ Sponsor ${index + 1}: Contract not found (foreign key error)`);
                reject(new Error(`Contract ${contractId} not found`));
                return;
              }
              
              reject(insertErr);
              return;
            }
            console.log(`✅ Sponsor ${index + 1}: Created successfully`);
            resolve({ success: true, action: 'created' });
          });
        }
        
        function insertSponsorWithoutImage() {
          const insertQuery = `
            INSERT INTO contract_sponsors 
            (contract_id, full_name, phone, id_card_number, relationship, address) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertQuery, [
            contractId,
            sponsor.full_name,
            sponsor.phone,
            sponsor.id_card_number,
            sponsor.relationship || '',
            sponsor.address
          ], (insertErr) => {
            if (insertErr) {
              console.error(`❌ Sponsor ${index + 1}: Insert without image error:`, insertErr.message);
              
              // Skip this sponsor but don't fail the whole contract
              console.log(`⚠️ Sponsor ${index + 1}: Skipping due to persistent error`);
              resolve({ success: false, action: 'skipped', error: insertErr.message });
              return;
            }
            console.log(`✅ Sponsor ${index + 1}: Created successfully (without image)`);
            resolve({ success: true, action: 'created_no_image' });
          });
        }
      } catch (error) {
        console.error(`❌ Sponsor ${index + 1}: Unexpected error:`, error.message);
        resolve({ success: false, action: 'skipped', error: error.message });
      }
    });
  }

  // Get items available for installment with latest prices (filtered by branch)
  static getInstallmentItems(branchId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          i.id,
          i.name,
          i.description,
          i.available,
          i.installment,
          i.quantity,
          i.item_image,
          i.branch_id,
          b.name as branch_name,
          ip.id as price_id,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price
        FROM items i
        LEFT JOIN item_prices ip ON i.id = ip.item_id
        LEFT JOIN branches b ON i.branch_id = b.id
        WHERE i.available = 1 
          AND i.installment = 1
          AND ip.date = (
            SELECT MAX(date) 
            FROM item_prices 
            WHERE item_id = i.id
          )
      `;
      
      const params = [];
      if (branchId) {
        query += ` AND i.branch_id = ?`;
        params.push(branchId);
      }
      
      query += ` ORDER BY i.name`;
      
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Convert BLOB images to base64
        const items = results.map(item => {
          if (item.item_image) {
            try {
              item.item_image = Buffer.from(item.item_image).toString('base64');
            } catch (error) {
              console.error('Error serializing image:', error);
              item.item_image = null;
            }
          }
          return item;
        });
        
        resolve(items);
      });
    });
  }

  // ⭐ UPDATED: Apply for new contract with better error handling
  static apply(applicationData) {
    return new Promise((resolve, reject) => {
      const { customer_data, sponsors_data, contract_data } = applicationData;
      const originalContractId = contract_data.original_contract_id;

      console.log('🚀 Starting contract application...');
      console.log('📋 Customer:', customer_data.full_name);
      console.log('👥 Sponsors to process:', sponsors_data?.length || 0);
      console.log('📦 Contract item:', contract_data.item_name);

      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          console.error('❌ Transaction start error:', startErr);
          reject(startErr);
          return;
        }

        let customerId;
        let contractId;
        let contractCreated = false;

        // Helper function to rollback and reject
        const rollbackAndReject = (error, errorType = 'Unknown') => {
          console.error(`❌ Rollback due to ${errorType}:`, error.message);
          db.query('ROLLBACK', (rollbackErr) => {
            if (rollbackErr) {
              console.error('❌ Rollback error:', rollbackErr);
            }
            
            // If contract was created but failed later, try to delete it
            if (contractCreated && contractId) {
              console.log(`🔄 Cleaning up failed contract ${contractId}...`);
              const deleteQuery = 'DELETE FROM installment_contracts WHERE id = ? AND status = "pending"';
              db.query(deleteQuery, [contractId], () => {
                // Ignore delete errors
                reject(error);
              });
            } else {
              reject(error);
            }
          });
        };

        // 1. Check if customer exists
        const customerCheckQuery = 'SELECT id FROM contract_customers WHERE id_card_number = ?';
        db.query(customerCheckQuery, [customer_data.id_card_number], (err, customerResults) => {
          if (err) {
            return rollbackAndReject(err, 'Customer check');
          }

          if (customerResults.length > 0) {
            customerId = customerResults[0].id;
            console.log('✅ Found existing customer:', customerId);
            
            // Update customer (try without image first if there are issues)
            const updateCustomerQuery = `
              UPDATE contract_customers 
              SET full_name = ?, phone = ?, address = ?, email = ?, 
                  id_card_image = COALESCE(?, id_card_image)
              WHERE id = ?
            `;
            
            // Compress customer image if exists
            let customerImage = customer_data.id_card_image;
            if (customerImage && typeof customerImage === 'string' && customerImage.startsWith('data:')) {
              try {
                const base64Data = customerImage.split(',')[1];
                customerImage = Buffer.from(base64Data, 'base64');
                customerImage = compressImageBuffer(customerImage).catch(() => null);
              } catch (imageErr) {
                console.error('❌ Customer image processing error:', imageErr.message);
                customerImage = null;
              }
            }
            
            db.query(updateCustomerQuery, [
              customer_data.full_name,
              customer_data.phone,
              customer_data.address,
              customer_data.email,
              customerImage,
              customerId
            ], (updateErr) => {
              if (updateErr) {
                console.error('⚠️ Customer update error, trying without image...', updateErr.message);
                
                // Try without image
                const updateWithoutImageQuery = `
                  UPDATE contract_customers 
                  SET full_name = ?, phone = ?, address = ?, email = ?
                  WHERE id = ?
                `;
                
                db.query(updateWithoutImageQuery, [
                  customer_data.full_name,
                  customer_data.phone,
                  customer_data.address,
                  customer_data.email,
                  customerId
                ], (updateErr2) => {
                  if (updateErr2) {
                    return rollbackAndReject(updateErr2, 'Customer update');
                  }
                  console.log('✅ Customer updated (without image)');
                  proceedWithContract();
                });
              } else {
                console.log('✅ Customer updated successfully');
                proceedWithContract();
              }
            });
          } else {
            // Create new customer
            const insertCustomerQuery = `
              INSERT INTO contract_customers 
              (full_name, phone, id_card_number, address, email, id_card_image) 
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            console.log('🆕 Creating new customer...');
            
            // Compress customer image if exists
            let customerImage = customer_data.id_card_image;
            if (customerImage && typeof customerImage === 'string' && customerImage.startsWith('data:')) {
              try {
                const base64Data = customerImage.split(',')[1];
                customerImage = Buffer.from(base64Data, 'base64');
                customerImage = compressImageBuffer(customerImage).catch(() => null);
              } catch (imageErr) {
                console.error('❌ Customer image processing error:', imageErr.message);
                customerImage = null;
              }
            }
            
            db.query(insertCustomerQuery, [
              customer_data.full_name,
              customer_data.phone,
              customer_data.id_card_number,
              customer_data.address,
              customer_data.email,
              customerImage
            ], (insertErr, insertResult) => {
              if (insertErr) {
                console.error('⚠️ Customer insert error, trying without image...', insertErr.message);
                
                // Try without image
                const insertWithoutImageQuery = `
                  INSERT INTO contract_customers 
                  (full_name, phone, id_card_number, address, email) 
                  VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(insertWithoutImageQuery, [
                  customer_data.full_name,
                  customer_data.phone,
                  customer_data.id_card_number,
                  customer_data.address,
                  customer_data.email
                ], (insertErr2, insertResult2) => {
                  if (insertErr2) {
                    return rollbackAndReject(insertErr2, 'Customer creation');
                  }
                  customerId = insertResult2.insertId;
                  console.log('✅ New customer created (without image):', customerId);
                  proceedWithContract();
                });
              } else {
                customerId = insertResult.insertId;
                console.log('✅ New customer created:', customerId);
                proceedWithContract();
              }
            });
          }

          function proceedWithContract() {
            // 2. Check item availability
            const checkAvailabilityQuery = `
              SELECT quantity, name FROM items WHERE id = ?
            `;
            
            db.query(checkAvailabilityQuery, [contract_data.item_id], (availErr, availabilityResults) => {
              if (availErr) {
                return rollbackAndReject(availErr, 'Availability check');
              }

              if (availabilityResults.length === 0) {
                return rollbackAndReject(new Error('Item not found'), 'Item check');
              }

              const availableQuantity = availabilityResults[0].quantity;
              const itemName = availabilityResults[0].name;
              
              if (availableQuantity <= 0) {
                return rollbackAndReject(new Error(`Item "${itemName}" is out of stock`), 'Stock check');
              }

              // 3. Create installment contract
              const contractQuery = `
                INSERT INTO installment_contracts 
                (branch_id, user_id, customer_id, item_id, price_id,
                 total_price, down_payment, months, monthly_payment, 
                 installment_last_payment, start_date, status, original_contract_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
              `;
              
              console.log('📝 Creating contract...');
              console.log('📍 Branch ID:', contract_data.branch_id);
              db.query(contractQuery, [
                contract_data.branch_id,
                contract_data.worker_id,
                customerId,
                contract_data.item_id,
                contract_data.price_id,
                contract_data.total_price,
                contract_data.down_payment,
                contract_data.months,
                contract_data.monthly_payment,
                contract_data.installment_last_payment,
                contract_data.start_date,
                originalContractId || null
              ], (contractErr, contractResult) => {
                if (contractErr) {
                  console.error('❌ Contract creation error:', contractErr);
                  return rollbackAndReject(contractErr, 'Contract creation');
                }

                contractId = contractResult.insertId;
                contractCreated = true;
                console.log('✅ Contract created:', contractId);

                // 4. Update original contract if exists
                if (originalContractId) {
                  const updateOriginalQuery = `
                    UPDATE installment_contracts 
                    SET status = 'deleted', replaced_by_contract_id = ?, updated_at = NOW()
                    WHERE id = ? AND status = 'rejected'
                  `;
                  
                  db.query(updateOriginalQuery, [contractId, originalContractId], (updateOriginalErr) => {
                    if (updateOriginalErr) {
                      console.error('⚠️ Error updating original contract:', updateOriginalErr.message);
                    }
                    proceedWithApprovalAndSponsors();
                  });
                } else {
                  proceedWithApprovalAndSponsors();
                }
              });
            });
          }

          function proceedWithApprovalAndSponsors() {
            // 5. Create contract approval record
            const approvalQuery = `
              INSERT INTO contract_approvals 
              (contract_id, approver_id, status) 
              VALUES (?, ?, 'pending_review')
            `;
            
            console.log('📋 Creating approval record...');
            db.query(approvalQuery, [
              contractId,
              contract_data.worker_id
            ], (approvalErr) => {
              if (approvalErr) {
                console.error('⚠️ Approval creation error:', approvalErr.message);
                // Don't fail the whole contract if approval record fails
                console.log('⚠️ Continuing without approval record...');
              }

              // 6. Process sponsors
              processSponsors();
            });
          }

          function processSponsors() {
            if (!sponsors_data || !Array.isArray(sponsors_data) || sponsors_data.length === 0) {
              console.log('✅ No sponsors to add');
              return commitTransaction();
            }

            console.log(`🔄 Processing ${sponsors_data.length} sponsors sequentially...`);
            
            // Process sponsors one by one
            const processSponsor = (index, results = []) => {
              if (index >= sponsors_data.length) {
                console.log(`✅ All sponsors processed: ${results.filter(r => r.success).length} succeeded, ${results.filter(r => !r.success).length} failed`);
                
                // Even if some sponsors failed, commit the transaction
                // (contract is still valid without all sponsors)
                if (results.some(r => !r.success)) {
                  console.log('⚠️ Some sponsors failed, but contract will still be created');
                }
                
                commitTransaction();
                return;
              }

              const sponsor = sponsors_data[index];
              
              // Skip invalid sponsors
              if (!sponsor || !sponsor.full_name || !sponsor.id_card_number) {
                console.log(`⚠️ Skipping invalid sponsor at index ${index}`);
                results.push({ index, success: false, reason: 'Invalid data' });
                setTimeout(() => processSponsor(index + 1, results), 50);
                return;
              }

              Contract.insertSponsorSafely(contractId, sponsor, index)
                .then(result => {
                  results.push({ index, ...result });
                  setTimeout(() => processSponsor(index + 1, results), 100); // Small delay between sponsors
                })
                .catch(error => {
                  console.error(`❌ Sponsor ${index} failed:`, error.message);
                  results.push({ index, success: false, error: error.message });
                  setTimeout(() => processSponsor(index + 1, results), 100);
                });
            };

            // Start processing
            processSponsor(0);
          }

          function commitTransaction() {
            console.log('💾 Committing transaction...');
            db.query('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('❌ Commit error:', commitErr.message);
                return rollbackAndReject(commitErr, 'Commit');
              }
              
              console.log('🎉 Transaction committed successfully!');
              
              resolve({
                contractId,
                item_name: contract_data.item_name,
                total_price: contract_data.total_price,
                quantity: contract_data.quantity || 1,
                contract_number: contract_data.contract_number || 1,
                original_contract_id: originalContractId,
                success: true,
                isReapplication: !!originalContractId
              });
            });
          }
        });
      });
    });
  }

  // Apply for multiple contracts (batch processing with quantity support)
  static applyMultiple(contractsData) {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting multiple contract application...');
      console.log('📦 Total contracts to process:', contractsData.length);
      
      const results = [];
      const errors = [];
      let processed = 0;
      const total = contractsData.length;

      if (total === 0) {
        return resolve({
          success: false,
          results: [],
          errors: [{ error: 'No contracts to process' }],
          total: 0,
          successful: 0,
          failed: 1
        });
      }

      // Process contracts sequentially to avoid connection overload
      const processSequentially = () => {
        if (processed >= total) {
          console.log('📊 All contracts processed.');
          console.log(`✅ Successful: ${results.length}`);
          console.log(`❌ Failed: ${errors.length}`);
          
          return resolve({
            success: results.length > 0,
            results,
            errors,
            total,
            successful: results.length,
            failed: errors.length
          });
        }

        const contractData = contractsData[processed];
        const currentIndex = processed;
        console.log(`\n🔧 Processing contract ${currentIndex + 1}/${total}...`);
        
        Contract.apply(contractData)
          .then(result => {
            console.log(`✅ Contract ${currentIndex + 1} successful: #${result.contractId}`);
            results.push({
              index: currentIndex,
              item_name: contractData.contract_data.item_name,
              contract_number: contractData.contract_data.contract_number,
              original_contract_id: contractData.contract_data.original_contract_id,
              ...result
            });
            processed++;
            // Add delay before processing next contract
            setTimeout(() => {
              processSequentially();
            }, 1000); // 1 second delay between contracts
          })
          .catch(error => {
            console.error(`❌ Contract ${currentIndex + 1} failed:`, error.message);
            errors.push({
              index: currentIndex,
              item_name: contractData.contract_data?.item_name || 'Unknown',
              error: error.message,
              original_contract_id: contractData.contract_data?.original_contract_id
            });
            processed++;
            // Continue with next contract even if this one fails
            setTimeout(() => {
              processSequentially();
            }, 1000);
          });
      };

      // Start processing contracts sequentially
      processSequentially();
    });
  }

  // Get pending contracts for admin review with price info
  static getPendingContracts(branchIds = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price,
          i.quantity as item_quantity,
          u.username as worker_name,
          ca.status as approval_status,
          b.name as branch_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
        LEFT JOIN branches b ON ic.branch_id = b.id
        WHERE ic.status = 'pending'
      `;
      
      const params = [];
      
      // Filter by accessible branches if provided
      if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
        const placeholders = branchIds.map(() => '?').join(',');
        query += ` AND ic.branch_id IN (${placeholders})`;
        params.push(...branchIds);
      }
      
      query += ' ORDER BY ic.created_at DESC';
      
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get all contracts with filters and price info
  static getAllContracts(status = null, branchIds = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          ip.price_cash,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.buy_price,
          ip.on_sale_price,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date,
          b.name as branch_name,
          -- Count payments for this contract
          (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.contract_id = ic.id) as total_payments,
          (SELECT COUNT(*) FROM installment_payments ipay WHERE ipay.contract_id = ic.id AND ipay.status = 'paid') as paid_payments,
          -- Get information about original contract if this is a reapplication
          oic.id as original_contract_id_ref,
          oic.customer_id as original_customer_id,
          oic.item_id as original_item_id,
          oic.total_price as original_total_price,
          oic.status as original_status,
          occ.full_name as original_customer_name,
          oi.name as original_item_name,
          -- Get information about replacement contract if this was replaced
          ric.id as replacement_contract_id,
          ric.status as replacement_status,
          ric.created_at as replacement_created_at
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
        LEFT JOIN branches b ON ic.branch_id = b.id
        -- Left join for original contract (if this is a reapplication)
        LEFT JOIN installment_contracts oic ON ic.original_contract_id = oic.id
        LEFT JOIN contract_customers occ ON oic.customer_id = occ.id
        LEFT JOIN items oi ON oic.item_id = oi.id
        -- Left join for replacement contract (if this was replaced)
        LEFT JOIN installment_contracts ric ON ic.replaced_by_contract_id = ric.id
      `;
      
      const params = [];
      const conditions = [];
      
      if (status && status !== 'all') {
        conditions.push('ic.status = ?');
        params.push(status);
      }
      
      // Filter by accessible branches if provided
      if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
        const placeholders = branchIds.map(() => '?').join(',');
        conditions.push(`ic.branch_id IN (${placeholders})`);
        params.push(...branchIds);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY ic.created_at DESC';

      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Process the results to add relationship information
        const processedResults = results.map(contract => {
          // Add relationship information
          if (contract.original_contract_id_ref) {
            contract.original_contract_info = {
              id: contract.original_contract_id_ref,
              customer_id: contract.original_customer_id,
              item_id: contract.original_item_id,
              total_price: contract.original_total_price,
              status: contract.original_status,
              customer_name: contract.original_customer_name,
              item_name: contract.original_item_name
            };
          }
          
          if (contract.replacement_contract_id) {
            contract.replacement_contract_info = {
              id: contract.replacement_contract_id,
              status: contract.replacement_status,
              created_at: contract.replacement_created_at
            };
          }
          
          // Clean up temporary fields
          delete contract.original_contract_id_ref;
          delete contract.original_customer_id;
          delete contract.original_item_id;
          delete contract.original_total_price;
          delete contract.original_status;
          delete contract.original_customer_name;
          delete contract.original_item_name;
          delete contract.replacement_contract_id;
          delete contract.replacement_status;
          delete contract.replacement_created_at;
          
          return contract;
        });
        
        resolve(processedResults);
      });
    });
  }

  // Get contract details by ID with price info and relationships
  static getById(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          cc.id_card_number as customer_id_card_number,
          cc.id_card_image as customer_id_card_image,
          cc.address as customer_address,
          cc.email as customer_email,
          i.name as item_name,
          i.description as item_description,
          ip.installment_first_payment as default_first_payment,
          ip.installment_months as default_months,
          ip.installment_per_month as default_monthly,
          ip.installment_last_payment as default_last_payment,
          ip.price_cash,
          ip.price_installment_total as default_total_price,
          ip.buy_price,
          ip.on_sale_price,
          u.username as worker_name,
          ca.status as approval_status,
          ca.reason as rejection_reason,
          ca.approver_id,
          ca.updated_at as decision_date,
          -- Original contract info (if this is a reapplication)
          oic.id as original_contract_id_ref,
          oic.status as original_status,
          oic.created_at as original_created_at,
          occ.full_name as original_customer_name,
          oi.name as original_item_name,
          -- Replacement contract info (if this was replaced)
          ric.id as replacement_contract_id,
          ric.status as replacement_status,
          ric.created_at as replacement_created_at,
          rcc.full_name as replacement_customer_name,
          ri.name as replacement_item_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN item_prices ip ON ic.price_id = ip.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN contract_approvals ca ON ic.id = ca.contract_id
        -- Left join for original contract (if this is a reapplication)
        LEFT JOIN installment_contracts oic ON ic.original_contract_id = oic.id
        LEFT JOIN contract_customers occ ON oic.customer_id = occ.id
        LEFT JOIN items oi ON oic.item_id = oi.id
        -- Left join for replacement contract (if this was replaced)
        LEFT JOIN installment_contracts ric ON ic.replaced_by_contract_id = ric.id
        LEFT JOIN contract_customers rcc ON ric.customer_id = rcc.id
        LEFT JOIN items ri ON ric.item_id = ri.id
        WHERE ic.id = ?
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        const contract = results[0] || null;
        
        if (contract) {
          // Convert customer image if exists
          if (contract.customer_id_card_image) {
            try {
              if (Buffer.isBuffer(contract.customer_id_card_image)) {
                contract.customer_id_card_image = contract.customer_id_card_image.toString('base64');
              } else if (typeof contract.customer_id_card_image === 'string' && 
                        !contract.customer_id_card_image.startsWith('data:')) {
                // Keep as raw base64 - frontend will add data URL prefix
              }
            } catch (error) {
              console.error('Error converting customer image:', error);
              contract.customer_id_card_image = null;
            }
          }
          
          // Add relationship information
          if (contract.original_contract_id_ref) {
            contract.original_contract_info = {
              id: contract.original_contract_id_ref,
              status: contract.original_status,
              created_at: contract.original_created_at,
              customer_name: contract.original_customer_name,
              item_name: contract.original_item_name
            };
          }
          
          if (contract.replacement_contract_id) {
            contract.replacement_contract_info = {
              id: contract.replacement_contract_id,
              status: contract.replacement_status,
              created_at: contract.replacement_created_at,
              customer_name: contract.replacement_customer_name,
              item_name: contract.replacement_item_name
            };
          }
          
          // Clean up temporary fields
          delete contract.original_contract_id_ref;
          delete contract.original_status;
          delete contract.original_created_at;
          delete contract.original_customer_name;
          delete contract.original_item_name;
          delete contract.replacement_contract_id;
          delete contract.replacement_status;
          delete contract.replacement_created_at;
          delete contract.replacement_customer_name;
          delete contract.replacement_item_name;
        }
        
        resolve(contract);
      });
    });
  }

  // Get sponsors for a contract
  static getSponsors(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          full_name,
          phone,
          id_card_number,
          id_card_image,
          relationship,
          address
        FROM contract_sponsors 
        WHERE contract_id = ?
        ORDER BY id
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Convert BLOB images to base64
        const sponsors = results.map(sponsor => {
          if (sponsor.id_card_image) {
            try {
              if (Buffer.isBuffer(sponsor.id_card_image)) {
                sponsor.id_card_image = sponsor.id_card_image.toString('base64');
              } else if (sponsor.id_card_image.type === 'Buffer' && sponsor.id_card_image.data) {
                sponsor.id_card_image = Buffer.from(sponsor.id_card_image.data).toString('base64');
              } else if (typeof sponsor.id_card_image === 'string') {
                if (!sponsor.id_card_image.startsWith('data:')) {
                  sponsor.id_card_image = `data:image/jpeg;base64,${sponsor.id_card_image}`;
                }
              }
            } catch (error) {
              console.error('Error converting sponsor image:', error);
              sponsor.id_card_image = null;
            }
          }
          return sponsor;
        });
        
        resolve(sponsors);
      });
    });
  }

 // Approve contract - create payment schedule with new logic
static approve(contractId, approverId) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting contract approval for ID: ${contractId}`);
    
    db.query('START TRANSACTION', async (startErr) => {
      if (startErr) {
        console.error('❌ Error starting transaction:', startErr);
        reject(startErr);
        return;
      }

      try {
        // 1. Get contract details
        const contract = await Contract.getByIdForApproval(contractId);
        if (!contract) {
          throw new Error('Contract not found or already processed');
        }

        console.log(`📋 Contract found: ${contract.item_name}, Months: ${contract.months}`);

        // 2. Update contract status to 'active'
        await Contract.updateStatus(contractId, 'active');
        console.log('✅ Contract status updated to active');

        // 3. Create or update approval record
        await Contract.updateApproval(contractId, approverId);
        console.log('✅ Approval record updated');

        // 4. Create payment schedule
        const result = await Contract.createPaymentSchedule(contractId, contract);
        console.log('✅ Payment schedule created');

        // 5. Commit transaction
        await Contract.commitTransaction();
        console.log('💾 Transaction committed successfully');

        resolve({
          success: true,
          message: `Contract approved successfully. ${result.totalPayments} payments created`,
          contractId: contractId,
          paymentsCreated: result.totalPayments,
          breakdown: result.breakdown
        });

      } catch (error) {
        console.error('❌ Error during approval:', error.message);
        await Contract.rollbackTransaction();
        reject(error);
      }
    });
  });
}

// Helper method: Get contract for approval
static getByIdForApproval(contractId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        ic.*, 
        cc.full_name as customer_name, 
        i.name as item_name
      FROM installment_contracts ic
      LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
      LEFT JOIN items i ON ic.item_id = i.id
      WHERE ic.id = ? AND ic.status = "pending"
      FOR UPDATE
    `;
    
    db.query(query, [contractId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results[0] || null);
    });
  });
}

// Helper method: Update contract status
static updateStatus(contractId, status) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE installment_contracts SET status = ? WHERE id = ?';
    db.query(query, [status, contractId], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (result.affectedRows === 0) {
        reject(new Error('Contract not found or already updated'));
        return;
      }
      
      resolve(result);
    });
  });
}

// Helper method: Update approval record
static updateApproval(contractId, approverId) {
  return new Promise((resolve, reject) => {
    // First check if approval record exists
    const checkQuery = 'SELECT id FROM contract_approvals WHERE contract_id = ?';
    
    db.query(checkQuery, [contractId], (checkErr, checkResults) => {
      if (checkErr) {
        reject(checkErr);
        return;
      }

      let query, params;
      
      if (checkResults.length > 0) {
        // Update existing
        query = `
          UPDATE contract_approvals 
          SET status = 'approved', approver_id = ?, updated_at = NOW() 
          WHERE contract_id = ?
        `;
        params = [approverId, contractId];
      } else {
        // Insert new
        query = `
          INSERT INTO contract_approvals 
          (contract_id, approver_id, status) 
          VALUES (?, ?, 'approved')
        `;
        params = [contractId, approverId];
      }

      db.query(query, params, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (result.affectedRows === 0) {
          reject(new Error('Failed to update approval record'));
          return;
        }
        
        resolve(result);
      });
    });
  });
}

// ⭐ FIXED: Create payment schedule - with correct date calculation and timezone handling
static createPaymentSchedule(contractId, contract) {
  return new Promise((resolve, reject) => {
    const downPayment = parseFloat(contract.down_payment);
    const monthlyPayment = parseFloat(contract.monthly_payment);
    const lastPayment = parseFloat(contract.installment_last_payment);
    const installmentMonths = parseInt(contract.months);
    const approvalDate = new Date();
    
    const totalPayments = installmentMonths + 1;
    console.log(`📅 Creating payment schedule: ${totalPayments} total payments`);
    console.log(`📊 Installment months: ${installmentMonths}`);
    console.log(`📅 Approval date: ${approvalDate.toISOString().split('T')[0]}`);

    // Helper function to get date string in YYYY-MM-DD format without timezone issues
    const getDateString = (year, month, day) => {
      // Create date in local timezone and format as YYYY-MM-DD
      const date = new Date(year, month, day);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Get approval date in correct format
    const approvalYear = approvalDate.getFullYear();
    const approvalMonth = approvalDate.getMonth();
    const approvalDay = approvalDate.getDate();
    const formattedApprovalDate = getDateString(approvalYear, approvalMonth, approvalDay);

    // First create down payment
    const downPaymentQuery = `
      INSERT INTO installment_payments 
      (contract_id, month_number, bill_date, due_date, amount_due, amount_paid, status, is_overdue) 
      VALUES (?, 0, ?, NULL, ?, 0.00, 'pending', 0)
    `;
    
    db.query(downPaymentQuery, [
      contractId,
      formattedApprovalDate,
      downPayment
    ], (downPaymentErr) => {
      if (downPaymentErr) {
        reject(downPaymentErr);
        return;
      }
      
      console.log(`✅ Created down payment (Month 0): ${downPayment} [${formattedApprovalDate}]`);

      // Create installment payments sequentially
      const createInstallments = (monthNum = 1) => {
        if (monthNum > installmentMonths) {
          // All payments created
          console.log(`✅ All ${installmentMonths} installment payments created`);
          resolve({
            totalPayments: totalPayments,
            breakdown: {
              down_payment: downPayment,
              monthly_payments: installmentMonths - (installmentMonths > 0 ? 1 : 0),
              last_payment: installmentMonths > 0 ? lastPayment : 0,
              total_installment_months: installmentMonths
            }
          });
          return;
        }

        // Calculate target month correctly
        const currentDate = new Date(approvalDate);
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // Calculate target year and month
        let targetYear = currentYear;
        let targetMonth = currentMonth + monthNum;
        
        // Handle month overflow (if targetMonth > 11)
        while (targetMonth > 11) {
          targetMonth -= 12;
          targetYear += 1;
        }
        
        // Create bill date (1st of the target month)
        const billDateStr = getDateString(targetYear, targetMonth, 1);
        
        // Create due date (15th of the target month)
        const dueDateStr = getDateString(targetYear, targetMonth, 15);
        
        // Determine amount for this month
        let amountDue;
        if (monthNum < installmentMonths) {
          amountDue = monthlyPayment;
        } else {
          amountDue = lastPayment;
        }

        const installmentQuery = `
          INSERT INTO installment_payments 
          (contract_id, month_number, bill_date, due_date, amount_due, amount_paid, status, is_overdue) 
          VALUES (?, ?, ?, ?, ?, 0.00, 'pending', 0)
        `;
        
        db.query(installmentQuery, [
          contractId,
          monthNum,
          billDateStr,
          dueDateStr,
          amountDue
        ], (installmentErr) => {
          if (installmentErr) {
            reject(installmentErr);
            return;
          }
          
          console.log(`✅ Created installment payment (Month ${monthNum}): ${amountDue} [Bill: ${billDateStr}, Due: ${dueDateStr}]`);
          
          // Recursively create next payment
          createInstallments(monthNum + 1);
        });
      };
      
      // Start creating payments from month 1
      if (installmentMonths > 0) {
        createInstallments(1);
      } else {
        // No installment months, just resolve
        resolve({
          totalPayments: totalPayments,
          breakdown: {
            down_payment: downPayment,
            monthly_payments: 0,
            last_payment: 0,
            total_installment_months: 0
          }
        });
      }
    });
  });
}

// Helper method: Commit transaction
static commitTransaction() {
  return new Promise((resolve, reject) => {
    db.query('COMMIT', (commitErr) => {
      if (commitErr) {
        reject(commitErr);
        return;
      }
      resolve();
    });
  });
}

// Helper method: Rollback transaction
static rollbackTransaction() {
  return new Promise((resolve, reject) => {
    db.query('ROLLBACK', (rollbackErr) => {
      if (rollbackErr) {
        reject(rollbackErr);
        return;
      }
      resolve();
    });
  });
}

  // Reject contract
  static reject(contractId, approverId, reason) {
    return new Promise((resolve, reject) => {
      db.query('START TRANSACTION', (startErr) => {
        if (startErr) {
          reject(startErr);
          return;
        }

        // 1. Update contract status to 'rejected'
        const updateContractQuery = 'UPDATE installment_contracts SET status = "rejected" WHERE id = ?';
        db.query(updateContractQuery, [contractId], (updateErr) => {
          if (updateErr) {
            return rollbackAndReject(updateErr, reject);
          }

          // 2. Update approval status to 'rejected'
          const updateApprovalQuery = `
            UPDATE contract_approvals 
            SET status = 'rejected', approver_id = ?, reason = ?, updated_at = NOW() 
            WHERE contract_id = ?
          `;
          db.query(updateApprovalQuery, [approverId, reason, contractId], (approvalErr) => {
            if (approvalErr) {
              return rollbackAndReject(approvalErr, reject);
            }

            // Commit transaction
            db.query('COMMIT', (commitErr) => {
              if (commitErr) {
                return rollbackAndReject(commitErr, reject);
              }
              
              resolve({
                success: true,
                message: 'Contract rejected successfully'
              });
            });
          });
        });

        function rollbackAndReject(error, rejectCallback) {
          db.query('ROLLBACK', () => {
            rejectCallback(error);
          });
        }
      });
    });
  }

  // Get payment schedule for a contract
  static getPaymentSchedule(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM installment_payments 
        WHERE contract_id = ? 
        ORDER BY month_number
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Search contracts by customer name for payment processing
  static searchByCustomer(customerName) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ic.*,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          i.name as item_name,
          u.username as worker_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE cc.full_name LIKE ? 
          AND ic.status IN ('active', 'completed')
        ORDER BY ic.created_at DESC
      `;
      
      db.query(query, [`%${customerName}%`], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get payment summary for a contract
  static getPaymentSummary(contractId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount_due) as total_amount_due,
          SUM(amount_paid) as total_amount_paid,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN is_overdue = 1 THEN 1 ELSE 0 END) as overdue_count
        FROM installment_payments 
        WHERE contract_id = ?
      `;
      
      db.query(query, [contractId], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || null);
      });
    });
  }

  // Get contracts with branch analysis (for Contract Branches page)
  static getContractsWithBranchAnalysis(branchIds = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          ic.id as contract_id,
          ic.branch_id as contract_branch_id,
          b.name as contract_branch_name,
          ic.customer_id,
          cc.full_name as customer_name,
          cc.phone as customer_phone,
          ic.item_id,
          i.name as item_name,
          ic.total_price,
          ic.down_payment,
          ic.months,
          ic.monthly_payment,
          ic.status,
          ic.created_at,
          u.username as worker_name
        FROM installment_contracts ic
        LEFT JOIN contract_customers cc ON ic.customer_id = cc.id
        LEFT JOIN items i ON ic.item_id = i.id
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN branches b ON ic.branch_id = b.id
        WHERE ic.status IN ('active', 'completed')
      `;
      
      const params = [];
      if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
        const placeholders = branchIds.map(() => '?').join(',');
        query += ` AND ic.branch_id IN (${placeholders})`;
        params.push(...branchIds);
      }
      
      query += ` ORDER BY ic.created_at DESC`;
      
      db.query(query, params, (err, contracts) => {
        if (err) {
          reject(err);
          return;
        }
        
        // For each contract, get payments and transactions
        const contractsWithDetails = contracts.map(contract => ({
          ...contract,
          payments: []
        }));
        
        // Get payments and transactions for each contract
        const paymentPromises = contractsWithDetails.map(contract => {
          return new Promise((resolvePayment) => {
            // Get payments for this contract
            const paymentQuery = `
              SELECT 
                ip.*,
                (SELECT COUNT(*) FROM installment_transactions it WHERE it.payment_id = ip.id) as transaction_count
              FROM installment_payments ip
              WHERE ip.contract_id = ?
              ORDER BY ip.month_number ASC
            `;
            
            db.query(paymentQuery, [contract.contract_id], (err, payments) => {
              if (err) {
                resolvePayment({ contract, payments: [] });
                return;
              }
              
              // Get transactions for each payment
              const transactionPromises = payments.map(payment => {
                return new Promise((resolveTransaction) => {
                  const transactionQuery = `
                    SELECT 
                      it.*,
                      b.name as branch_name,
                      u.username as worker_name
                    FROM installment_transactions it
                    LEFT JOIN branches b ON it.branch_id = b.id
                    LEFT JOIN users u ON it.worker_id = u.id
                    WHERE it.payment_id = ?
                    ORDER BY it.payment_date DESC
                  `;
                  
                  db.query(transactionQuery, [payment.id], (err, transactions) => {
                    if (err) {
                      resolveTransaction({ ...payment, transactions: [] });
                    } else {
                      resolveTransaction({ ...payment, transactions: transactions || [] });
                    }
                  });
                });
              });
              
              Promise.all(transactionPromises).then(paymentsWithTransactions => {
                resolvePayment({ contract, payments: paymentsWithTransactions });
              });
            });
          });
        });
        
        Promise.all(paymentPromises).then(results => {
          const finalContracts = results.map(result => ({
            ...result.contract,
            payments: result.payments
          }));
          
          resolve(finalContracts);
        });
      });
    });
  }
}

module.exports = Contract;